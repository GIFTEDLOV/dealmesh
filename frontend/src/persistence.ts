export type PersistedStatus =
  | "SUBMITTED"
  | "PENDING"
  | "PROPOSING"
  | "COMMITTING"
  | "REVEALING"
  | "ACCEPTED"
  | "FINALIZED"
  | "FAILED"
  | "UNKNOWN_SUBMISSION";

export interface PersistedTransaction {
  readonly id: string;
  readonly hash?: string;
  readonly method: string;
  readonly args: readonly unknown[];
  readonly createdAt: number;
  readonly status: PersistedStatus;
  readonly executionResultName?: string;
  readonly expectedReadBack?: unknown;
  readonly error?: string;
}

export interface TransactionStore {
  get(id: string): PersistedTransaction | undefined;
  put(record: PersistedTransaction): void;
  list(): PersistedTransaction[];
  remove(id: string): void;
}

const STORAGE_KEY = "dealmesh:transactions:v1";

function encode(value: unknown): unknown {
  if (typeof value === "bigint") return { __dealmesh_bigint__: value.toString() };
  if (Array.isArray(value)) return value.map(encode);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, encode(item)]),
    );
  }
  return value;
}

function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (
      entries.length === 1 &&
      entries[0]?.[0] === "__dealmesh_bigint__" &&
      typeof entries[0][1] === "string"
    ) {
      return BigInt(entries[0][1]);
    }
    return Object.fromEntries(entries.map(([key, item]) => [key, decode(item)]));
  }
  return value;
}

export class MemoryTransactionStore implements TransactionStore {
  private readonly records = new Map<string, PersistedTransaction>();

  get(id: string): PersistedTransaction | undefined {
    return this.records.get(id);
  }

  put(record: PersistedTransaction): void {
    this.records.set(record.id, record);
  }

  list(): PersistedTransaction[] {
    return [...this.records.values()].sort((a, b) => a.createdAt - b.createdAt);
  }

  remove(id: string): void {
    this.records.delete(id);
  }
}

export class LocalStorageTransactionStore implements TransactionStore {
  private readonly storage: Storage;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
  }

  private read(): Record<string, PersistedTransaction> {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    try {
      const parsed: unknown = decode(JSON.parse(raw));
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return parsed as Record<string, PersistedTransaction>;
    } catch {
      return {};
    }
  }

  private write(records: Record<string, PersistedTransaction>): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(encode(records)));
  }

  get(id: string): PersistedTransaction | undefined {
    return this.read()[id];
  }

  put(record: PersistedTransaction): void {
    const records = this.read();
    records[record.id] = record;
    this.write(records);
  }

  list(): PersistedTransaction[] {
    return Object.values(this.read()).sort((a, b) => a.createdAt - b.createdAt);
  }

  remove(id: string): void {
    const records = this.read();
    delete records[id];
    this.write(records);
  }
}

export function pendingTransactions(store: TransactionStore): PersistedTransaction[] {
  return store.list().filter((record) =>
    ["SUBMITTED", "PENDING", "PROPOSING", "COMMITTING", "REVEALING", "ACCEPTED"].includes(
      record.status,
    ),
  );
}
