import { createClient } from "genlayer-js";
import {
  ExecutionResult,
  TransactionStatus,
  type CalldataEncodable,
  type Hash,
} from "genlayer-js/types";
import {
  pendingTransactions,
  type PersistedTransaction,
  type TransactionStore,
} from "./persistence.js";

type Client = ReturnType<typeof createClient>;

export class LifecycleError extends Error {
  constructor(
    readonly code:
      | "TX_HASH_NOT_RETURNED"
      | "TX_SUBMISSION_UNKNOWN"
      | "FINALITY_NOT_REACHED"
      | "CONSENSUS_FAILURE"
      | "EXECUTION_FAILED"
      | "READBACK_MISMATCH",
    message: string,
    readonly category: "technical" | "consensus" | "execution" | "state-mismatch" | "wallet-rpc" = "technical",
  ) {
    super(message);
    this.name = "LifecycleError";
  }
}

export interface ReadBackExpectation {
  readonly read: () => Promise<unknown>;
  readonly expected?: unknown;
  readonly verify?: (actual: unknown) => boolean;
}

export interface SubmittedWrite {
  readonly id: string;
  readonly hash: string;
}

export function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
    .join(",")}}`;
}

export function exactReadBack(actual: unknown, expected: unknown): boolean {
  return stableJson(actual) === stableJson(expected);
}

function nextId(method: string, now: number): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random()}`;
  return `dealmesh:${method}:${now}:${random}`;
}

export async function submitWriteOnce(
  client: Pick<Client, "writeContract">,
  store: TransactionStore,
  input: {
    readonly address: `0x${string}`;
    readonly method: string;
    readonly args: readonly CalldataEncodable[];
    readonly expectedReadBack?: unknown;
    readonly now?: number;
  },
): Promise<SubmittedWrite> {
  const createdAt = input.now ?? Date.now();
  const id = nextId(input.method, createdAt);
  let hash: unknown;
  try {
    hash = await client.writeContract({
      address: input.address,
      functionName: input.method,
      args: [...input.args],
      value: 0n,
    });
  } catch (error) {
    store.put({
      id,
      method: input.method,
      args: input.args,
      createdAt,
      status: "UNKNOWN_SUBMISSION",
      expectedReadBack: input.expectedReadBack,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new LifecycleError(
      "TX_SUBMISSION_UNKNOWN",
      "The write result is unknown; recover manually and do not rebroadcast.",
    );
  }

  if (typeof hash !== "string" || hash.length === 0) {
    store.put({
      id,
      method: input.method,
      args: input.args,
      createdAt,
      status: "UNKNOWN_SUBMISSION",
      expectedReadBack: input.expectedReadBack,
    });
    throw new LifecycleError("TX_HASH_NOT_RETURNED", "The wallet returned no transaction hash.");
  }

  store.put({
    id,
    hash,
    method: input.method,
    args: input.args,
    createdAt,
    status: "SUBMITTED",
    expectedReadBack: input.expectedReadBack,
  });
  return { id, hash };
}

export async function finalizeAndReadBack(
  client: Pick<Client, "waitForTransactionReceipt">,
  store: TransactionStore,
  record: PersistedTransaction,
  readBack?: ReadBackExpectation,
): Promise<unknown> {
  if (!record.hash) {
    throw new LifecycleError("TX_SUBMISSION_UNKNOWN", "No hash is available for recovery.");
  }

  let receipt;
  try {
    receipt = await client.waitForTransactionReceipt({
      hash: record.hash as Hash,
      status: TransactionStatus.FINALIZED,
    });
  } catch (error) {
    throw new LifecycleError(
      "FINALITY_NOT_REACHED",
      error instanceof Error ? error.message : "The transaction did not reach finality.",
    );
  }

  const execution = receipt.txExecutionResultName ?? ExecutionResult.NOT_VOTED;
  if (execution !== ExecutionResult.FINISHED_WITH_RETURN) {
    store.put({ ...record, status: "FAILED", executionResultName: execution });
    throw new LifecycleError(
      "EXECUTION_FAILED",
      "The finalized transaction did not execute successfully.",
    );
  }

  if (readBack) {
    const actual = await readBack.read();
    const matches = readBack.verify
      ? readBack.verify(actual)
      : exactReadBack(actual, readBack.expected);
    if (!matches) {
      store.put({ ...record, status: "FAILED", executionResultName: execution });
      throw new LifecycleError(
        "READBACK_MISMATCH",
        "Finalized state did not match the expected exact read-back.",
      );
    }
    store.put({ ...record, status: "FINALIZED", executionResultName: execution });
    return actual;
  }

  store.put({ ...record, status: "FINALIZED", executionResultName: execution });
  return undefined;
}

/**
 * Finalize a parent write, then finalize and verify the first exact child
 * emitted by the contract's `on="finalized"` callback. The child is not
 * guessed or reconstructed: its transaction hash is discovered from the
 * finalized parent and is itself required to execute successfully.
 */
export async function finalizeWithTriggeredReadBack(
  client: Pick<Client, "waitForTransactionReceipt" | "getTriggeredTransactionIds">,
  store: TransactionStore,
  record: PersistedTransaction,
  parentReadBack: ReadBackExpectation,
  callbackReadBack: ReadBackExpectation,
): Promise<unknown> {
  await finalizeAndReadBack(client, store, record, parentReadBack);
  const childHashes = await client.getTriggeredTransactionIds({
    hash: record.hash as Hash,
  });
  const childHash = childHashes[0];
  if (!childHash) {
    throw new LifecycleError(
      "FINALITY_NOT_REACHED",
      "The finalized parent has no discoverable triggered finality callback.",
      "consensus",
    );
  }

  const childReceipt = await client.waitForTransactionReceipt({
    hash: childHash,
    status: TransactionStatus.FINALIZED,
  });
  const execution = childReceipt.txExecutionResultName ?? ExecutionResult.NOT_VOTED;
  const childRecord: PersistedTransaction = {
    id: `${record.id}:triggered:${childHash}`,
    hash: childHash,
    method: "<triggered-finality-callback>",
    args: [],
    createdAt: record.createdAt,
    status: "SUBMITTED",
  };
  if (execution !== ExecutionResult.FINISHED_WITH_RETURN) {
    store.put({ ...childRecord, status: "FAILED", executionResultName: execution });
    throw new LifecycleError(
      "EXECUTION_FAILED",
      "The finalized triggered callback did not execute successfully.",
    );
  }

  const actual = await callbackReadBack.read();
  const matches = callbackReadBack.verify
    ? callbackReadBack.verify(actual)
    : exactReadBack(actual, callbackReadBack.expected);
  if (!matches) {
    store.put({ ...childRecord, status: "FAILED", executionResultName: execution });
    throw new LifecycleError(
      "READBACK_MISMATCH",
      "The triggered callback state did not match the expected exact read-back.",
    );
  }
  store.put({ ...childRecord, status: "FINALIZED", executionResultName: execution });
  return actual;
}

export async function recoverPending(
  client: Pick<Client, "waitForTransactionReceipt">,
  store: TransactionStore,
  readBackFor: (record: PersistedTransaction) => ReadBackExpectation | undefined,
): Promise<ReadonlyArray<{ id: string; ok: boolean; error?: string }>> {
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const record of pendingTransactions(store)) {
    try {
      await finalizeAndReadBack(client, store, record, readBackFor(record));
      results.push({ id: record.id, ok: true });
    } catch (error) {
      results.push({
        id: record.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}
