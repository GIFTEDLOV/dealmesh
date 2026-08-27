import { describe, expect, it, vi } from "vitest";
import { ExecutionResult } from "genlayer-js/types";
import {
  LifecycleError,
  exactReadBack,
  finalizeAndReadBack,
  finalizeWithTriggeredReadBack,
  recoverPending,
  submitWriteOnce,
} from "../src/lifecycle.js";
import { MemoryTransactionStore } from "../src/persistence.js";

const ADDRESS = `0x${"1".repeat(40)}` as `0x${string}`;
const HASH = `0x${"2".repeat(64)}`;

describe("finalized lifecycle", () => {
  it("persists the returned hash before finality polling", async () => {
    const store = new MemoryTransactionStore();
    const writeContract = vi.fn(async () => HASH);
    const submitted = await submitWriteOnce(
      { writeContract } as never,
      store,
      { address: ADDRESS, method: "create_deal", args: ["USD", 1n], now: 10 },
    );
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(store.get(submitted.id)?.hash).toBe(HASH);
    expect(store.get(submitted.id)?.status).toBe("SUBMITTED");
  });

  it("requires successful finalized execution and exact read-back", async () => {
    const store = new MemoryTransactionStore();
    const record = {
      id: "known",
      hash: HASH,
      method: "bind_match",
      args: ["deal", "offer"],
      createdAt: 1,
      status: "SUBMITTED" as const,
    };
    store.put(record);
    const waitForTransactionReceipt = vi.fn(async () => ({
      txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN,
    }));
    const actual = await finalizeAndReadBack(
      { waitForTransactionReceipt } as never,
      store,
      record,
      { read: async () => ({ state: "BOUND", offer: "offer" }), expected: { offer: "offer", state: "BOUND" } },
    );
    expect(actual).toEqual({ state: "BOUND", offer: "offer" });
    expect(store.get("known")?.status).toBe("FINALIZED");
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1);
  });

  it("rejects failed execution and read-back mismatch", async () => {
    const failedStore = new MemoryTransactionStore();
    const failedRecord = { id: "failed", hash: HASH, method: "x", args: [], createdAt: 1, status: "SUBMITTED" as const };
    failedStore.put(failedRecord);
    await expect(
      finalizeAndReadBack(
        { waitForTransactionReceipt: async () => ({ txExecutionResultName: ExecutionResult.FINISHED_WITH_ERROR }) } as never,
        failedStore,
        failedRecord,
      ),
    ).rejects.toMatchObject({ code: "EXECUTION_FAILED" });

    const mismatchStore = new MemoryTransactionStore();
    const mismatchRecord = { id: "mismatch", hash: HASH, method: "x", args: [], createdAt: 1, status: "SUBMITTED" as const };
    mismatchStore.put(mismatchRecord);
    await expect(
      finalizeAndReadBack(
        { waitForTransactionReceipt: async () => ({ txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN }) } as never,
        mismatchStore,
        mismatchRecord,
        { read: async () => ({ state: "NO_MATCH" }), expected: { state: "BOUND" } },
      ),
    ).rejects.toMatchObject({ code: "READBACK_MISMATCH" });
  });

  it("recovers by hash only and never calls writeContract", async () => {
    const store = new MemoryTransactionStore();
    store.put({ id: "pending", hash: HASH, method: "bind_match", args: [], createdAt: 1, status: "ACCEPTED" });
    store.put({ id: "unknown", method: "bind_match", args: [], createdAt: 2, status: "UNKNOWN_SUBMISSION" });
    const waitForTransactionReceipt = vi.fn(async ({ hash }: { hash: string }) => {
      expect(hash).toBe(HASH);
      return { txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN };
    });
    const result = await recoverPending(
      { waitForTransactionReceipt } as never,
      store,
      () => undefined,
    );
    expect(result).toEqual([{ id: "pending", ok: true }]);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(1);
  });

  it("finalizes and reads back the exact triggered callback", async () => {
    const store = new MemoryTransactionStore();
    const record = {
      id: "parent",
      hash: HASH,
      method: "assess_offer",
      args: ["deal"],
      createdAt: 1,
      status: "SUBMITTED" as const,
    };
    store.put(record);
    const callbackHash = `0x${"3".repeat(64)}` as `0x${string}`;
    const waitForTransactionReceipt = vi.fn(async () => ({
      txExecutionResultName: ExecutionResult.FINISHED_WITH_RETURN,
    }));
    const getTriggeredTransactionIds = vi.fn(async () => [callbackHash]);
    const actual = await finalizeWithTriggeredReadBack(
      { waitForTransactionReceipt, getTriggeredTransactionIds } as never,
      store,
      record,
      { read: async () => ({ state: "ASSESSED_MATCH_PENDING_FINALITY" }), expected: { state: "ASSESSED_MATCH_PENDING_FINALITY" } },
      { read: async () => ({ state: "ASSESSED_MATCH_FINALIZED" }), expected: { state: "ASSESSED_MATCH_FINALIZED" } },
    );
    expect(actual).toEqual({ state: "ASSESSED_MATCH_FINALIZED" });
    expect(getTriggeredTransactionIds).toHaveBeenCalledWith({ hash: HASH });
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(2);
    expect(store.list().some((item) => item.hash === callbackHash && item.status === "FINALIZED")).toBe(true);
  });

  it("compares read-back objects independent of key order", () => {
    expect(exactReadBack({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true);
    expect(exactReadBack({ state: "BOUND" }, { state: "NO_MATCH" })).toBe(false);
    expect(new LifecycleError("READBACK_MISMATCH", "x")).toBeInstanceOf(Error);
  });
});
