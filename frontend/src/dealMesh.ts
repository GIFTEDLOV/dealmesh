import { createClient } from "genlayer-js";
import type { CalldataEncodable } from "genlayer-js/types";
import {
  finalizeAndReadBack,
  finalizeWithTriggeredReadBack,
  submitWriteOnce,
  type ReadBackExpectation,
  type SubmittedWrite,
} from "./lifecycle.js";
import type { TransactionStore } from "./persistence.js";
import { TransactionHashVariant } from "genlayer-js/types";

type Client = ReturnType<typeof createClient>;
type SupportedChain = NonNullable<NonNullable<Parameters<typeof createClient>[0]>["chain"]>;

export interface DealMeshClients {
  readonly readClient: Client;
  readonly writeClient: Client;
}

export function createDealMeshClients(input: {
  readonly chain: SupportedChain;
  readonly account: `0x${string}`;
  readonly provider: unknown;
}): DealMeshClients {
  const readClient = createClient({ chain: input.chain });
  const writeClient = createClient({
    chain: input.chain,
    account: input.account,
    provider: input.provider as never,
  });
  return { readClient, writeClient };
}

export interface DealMeshFrontend {
  readonly address: `0x${string}`;
  readonly readClient: Client;
  readonly writeClient: Client;
  readonly store: TransactionStore;
  submit(
    method: string,
    args: readonly CalldataEncodable[],
    expected?: ReadBackExpectation,
  ): Promise<SubmittedWrite>;
  finalize(
    submitted: SubmittedWrite,
    expected?: ReadBackExpectation,
  ): Promise<unknown>;
  finalizeWithCallback(
    submitted: SubmittedWrite,
    parentExpected: ReadBackExpectation,
    callbackExpected: ReadBackExpectation,
  ): Promise<unknown>;
  read(
    method: string,
    args: readonly CalldataEncodable[],
    finalized?: boolean,
  ): Promise<unknown>;
}

export function createDealMeshFrontend(input: {
  readonly address: `0x${string}`;
  readonly clients: DealMeshClients;
  readonly store: TransactionStore;
}): DealMeshFrontend {
  const { address, readClient, writeClient, store } = {
    address: input.address,
    readClient: input.clients.readClient,
    writeClient: input.clients.writeClient,
    store: input.store,
  };
  return {
    address,
    readClient,
    writeClient,
    store,
    async submit(method, args, expected) {
      return submitWriteOnce(writeClient, store, {
        address,
        method,
        args,
        expectedReadBack: expected?.expected,
      });
    },
    async finalize(submitted, expected) {
      const record = store.get(submitted.id);
      if (!record || record.hash !== submitted.hash) {
        throw new Error("Persisted transaction record is missing or hash-mismatched.");
      }
      return finalizeAndReadBack(readClient, store, record, expected);
    },
    async finalizeWithCallback(submitted, parentExpected, callbackExpected) {
      const record = store.get(submitted.id);
      if (!record || record.hash !== submitted.hash) {
        throw new Error("Persisted transaction record is missing or hash-mismatched.");
      }
      return finalizeWithTriggeredReadBack(
        readClient,
        store,
        record,
        parentExpected,
        callbackExpected,
      );
    },
    async read(method, args, finalized = false) {
      return readClient.readContract({
        address,
        functionName: method,
        args: [...args],
        transactionHashVariant: finalized
          ? TransactionHashVariant.LATEST_FINAL
          : TransactionHashVariant.LATEST_NONFINAL,
      });
    },
  };
}
