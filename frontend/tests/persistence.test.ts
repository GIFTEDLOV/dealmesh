import { describe, expect, it } from "vitest";
import {
  LocalStorageTransactionStore,
  MemoryTransactionStore,
  pendingTransactions,
} from "../src/persistence.js";

function fakeStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); },
  };
}

describe("transaction persistence", () => {
  it("round-trips BigInt args and retains only pending lifecycle records", () => {
    const store = new LocalStorageTransactionStore(fakeStorage());
    store.put({
      id: "one",
      hash: "0xabc",
      method: "create_deal",
      args: [123n],
      createdAt: 1,
      status: "ACCEPTED",
    });
    store.put({
      id: "two",
      method: "submit_offer",
      args: [],
      createdAt: 2,
      status: "UNKNOWN_SUBMISSION",
    });
    expect(store.get("one")?.args[0]).toBe(123n);
    expect(pendingTransactions(store).map((record) => record.id)).toEqual(["one"]);
  });

  it("recovers a transaction record without rebroadcast state", () => {
    const store = new MemoryTransactionStore();
    store.put({
      id: "known-hash",
      hash: "0xknown",
      method: "bind_match",
      args: ["deal", "offer"],
      createdAt: 1,
      status: "SUBMITTED",
    });
    const recovered = pendingTransactions(store);
    expect(recovered).toHaveLength(1);
    expect(recovered[0]?.hash).toBe("0xknown");
  });
});
