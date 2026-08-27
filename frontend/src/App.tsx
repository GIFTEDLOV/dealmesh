import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { testnetBradbury, studionet } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";
import {
  finalizeAndReadBack,
  finalizeWithTriggeredReadBack,
  LifecycleError,
  exactReadBack,
  type ReadBackExpectation,
} from "./lifecycle.js";
import {
  LocalStorageTransactionStore,
  pendingTransactions,
  type PersistedTransaction,
  type TransactionStore,
} from "./persistence.js";
import {
  createDealMeshClients,
  createDealMeshFrontend,
  type DealMeshFrontend,
} from "./dealMesh.js";

type Address = `0x${string}`;
type NetworkName = "studionet" | "testnetBradbury";
type JsonRecord = Record<string, unknown>;

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

const DEFAULT_ACTION = `0x${"a".repeat(64)}`;
const DEFAULT_CONTRACT = (import.meta.env.VITE_DEALMESH_CONTRACT_ADDRESS ?? "") as string;

function isAddress(value: string): value is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function parseView(value: unknown): JsonRecord {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The contract returned a non-object view result.");
  }
  return parsed as JsonRecord;
}

function displayError(error: unknown): { category: string; message: string } {
  if (error instanceof LifecycleError) {
    return { category: error.category, message: `${error.code}: ${error.message}` };
  }
  if (error instanceof Error) return { category: "technical", message: error.message };
  return { category: "technical", message: String(error) };
}

function expectedDealState(
  app: DealMeshFrontend,
  dealId: string,
  states: string[],
): ReadBackExpectation {
  return {
    read: async () => ({ state: parseView(await app.read("get_deal", [dealId], true)).state }),
    verify: (value) => {
      const record = value as JsonRecord;
      return typeof record.state === "string" && states.includes(record.state);
    },
  };
}

function formValue(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): string {
  return event.target.value;
}

export default function App() {
  const storeRef = useRef<TransactionStore>(new LocalStorageTransactionStore());
  const [network, setNetwork] = useState<NetworkName>("studionet");
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT);
  const [account, setAccount] = useState<Address | "">("");
  const [app, setApp] = useState<DealMeshFrontend | null>(null);
  const [dealId, setDealId] = useState("");
  const [deal, setDeal] = useState<JsonRecord | null>(null);
  const [offer, setOffer] = useState<JsonRecord | null>(null);
  const [assessment, setAssessment] = useState<JsonRecord | null>(null);
  const [bound, setBound] = useState(false);
  const [progress, setProgress] = useState<{
    method: string;
    status: string;
    hash?: string;
  } | null>(null);
  const [error, setError] = useState<{ category: string; message: string } | null>(null);
  const [records, setRecords] = useState<PersistedTransaction[]>([]);
  const [busy, setBusy] = useState(false);

  const [createForm, setCreateForm] = useState({
    partyB: "",
    priceUnit: "USD",
    maxPrice: "1000",
    latestDeadline: "4102444800",
    requirements: "use the secure channel; no external evidence",
    actionDigest: DEFAULT_ACTION,
  });
  const [acceptForm, setAcceptForm] = useState({
    priceUnit: "USD",
    minPrice: "100",
    earliestDeadline: "1",
    requirements: "accept the exact report through the secure channel",
  });
  const [offerForm, setOfferForm] = useState({
    price: "500",
    deadline: "2000000000",
    actionDigest: DEFAULT_ACTION,
    terms: '[{"key":"channel","value":"secure"}]',
  });

  const chain = useMemo(() => {
    return network === "studionet" ? studionet : testnetBradbury;
  }, [network]);

  const refresh = useCallback(async (frontend?: DealMeshFrontend) => {
    const activeFrontend = frontend ?? app;
    if (!activeFrontend || !dealId) return;
    const nextDeal = parseView(await activeFrontend.read("get_deal", [dealId]));
    setDeal(nextDeal);
    const nextOfferRaw = await activeFrontend.read("get_offer", [dealId]);
    setOffer(nextOfferRaw ? parseView(nextOfferRaw) : null);
    const nextAssessmentRaw = await activeFrontend.read("get_assessment", [dealId]);
    setAssessment(nextAssessmentRaw ? parseView(nextAssessmentRaw) : null);
    const nextOfferDigest = typeof nextDeal.offer_digest === "string" ? nextDeal.offer_digest : "";
    const nextBound = nextOfferDigest
      ? await activeFrontend.read("is_bound", [dealId, nextOfferDigest], true)
      : false;
    setBound(nextBound === true);
    setRecords(storeRef.current.list());
  }, [app, dealId]);

  const reconcileRecord = useCallback(async (frontend: DealMeshFrontend, record: PersistedTransaction) => {
    if (!record.hash) return;
    const args = record.args;
    if (record.method === "assess_offer") {
      const id = String(args[0]);
      const parent = expectedDealState(frontend, id, [
        "ASSESSED_MATCH_PENDING_FINALITY",
        "ASSESSED_NO_MATCH_PENDING_FINALITY",
        "ASSESSED_INCONCLUSIVE_PENDING_FINALITY",
        "ASSESSED_MATCH_FINALIZED",
        "ASSESSED_NO_MATCH",
        "ASSESSED_INCONCLUSIVE",
      ]);
      const callback: ReadBackExpectation = {
        read: async () => ({ state: parseView(await frontend.read("get_deal", [id], true)).state }),
        verify: (value) => [
          "ASSESSED_MATCH_FINALIZED",
          "ASSESSED_NO_MATCH",
          "ASSESSED_INCONCLUSIVE",
        ].includes(String((value as JsonRecord).state)),
      };
      await finalizeWithTriggeredReadBack(frontend.readClient, storeRef.current, record, parent, callback);
    } else if (record.method === "bind_match") {
      const id = String(args[0]);
      const digest = String(args[1]);
      const parent = expectedDealState(frontend, id, ["BINDING_PENDING_FINALITY", "BOUND"]);
      const callback: ReadBackExpectation = {
        read: async () => ({
          state: parseView(await frontend.read("get_deal", [id], true)).state,
          bound: await frontend.read("is_bound", [id, digest], true),
        }),
        verify: (value) => {
          const result = value as JsonRecord;
          return result.state === "BOUND" && result.bound === true;
        },
      };
      await finalizeWithTriggeredReadBack(frontend.readClient, storeRef.current, record, parent, callback);
    } else {
      const id = String(args[0]);
      await finalizeAndReadBack(frontend.readClient, storeRef.current, record, expectedDealState(
        frontend,
        id,
        record.method === "accept_participation"
          ? ["ACTIVE_B_COMMITTED"]
          : record.method === "submit_offer"
            ? ["OFFER_SUBMITTED"]
            : ["CREATED_A_COMMITTED"],
      ));
    }
  }, []);

  const recover = useCallback(async (frontend: DealMeshFrontend) => {
    const known = storeRef.current.list().filter((record) =>
      record.method !== "<triggered-finality-callback>"
      && (pendingTransactions(storeRef.current).some((pending) => pending.id === record.id)
      || record.method === "assess_offer"
      || record.method === "bind_match"),
    );
    for (const record of known) {
      try {
        await reconcileRecord(frontend, record);
      } catch (recoveryError) {
        setError(displayError(recoveryError));
      }
    }
    setRecords(storeRef.current.list());
  }, [reconcileRecord]);

  async function connectWallet(): Promise<void> {
    setError(null);
    const provider = window.ethereum;
    if (!provider) {
      setError({ category: "wallet-rpc", message: "No browser wallet provider was found." });
      return;
    }
    if (!isAddress(contractAddress)) {
      setError({ category: "technical", message: "Enter a valid deployed contract address first." });
      return;
    }
    try {
      const rawAccounts = await provider.request({ method: "eth_requestAccounts" });
      const first = Array.isArray(rawAccounts) ? rawAccounts[0] : undefined;
      if (typeof first !== "string" || !isAddress(first)) throw new Error("Wallet returned no usable account.");
      const clients = createDealMeshClients({
        chain,
        account: first,
        provider,
      });
      await clients.writeClient.connect(network);
      const frontend = createDealMeshFrontend({
        address: contractAddress as Address,
        clients,
        store: storeRef.current,
      });
      setAccount(first);
      setApp(frontend);
      setRecords(storeRef.current.list());
      await recover(frontend);
      if (dealId) await refresh(frontend);
    } catch (connectionError) {
      setError(displayError(connectionError));
    }
  }

  async function execute(
    method: string,
    args: readonly CalldataEncodable[],
    precondition?: ReadBackExpectation,
    parentReadBack?: ReadBackExpectation,
    callbackReadBack?: ReadBackExpectation,
  ): Promise<boolean> {
    if (!app) {
      setError({ category: "wallet-rpc", message: "Connect a wallet before writing." });
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      setProgress({ method, status: "PRECONDITION_READ" });
      if (precondition) {
        const actual = await precondition.read();
        const matches = precondition.verify
          ? precondition.verify(actual)
          : exactReadBack(actual, precondition.expected);
        if (!matches) {
          throw new LifecycleError(
            "READBACK_MISMATCH",
            "The live precondition state is not admissible for this action.",
            "state-mismatch",
          );
        }
      }
      const submitted = await app.submit(method, args, parentReadBack);
      setProgress({ method, status: "BROADCAST_ONCE / HASH_PERSISTED", hash: submitted.hash });
      if (parentReadBack && callbackReadBack) {
        await app.finalizeWithCallback(submitted, parentReadBack, callbackReadBack);
      } else {
        await app.finalize(submitted, parentReadBack);
      }
      setProgress({ method, status: "FINALIZED / EXECUTION_SUCCESS / READ_BACK", hash: submitted.hash });
      setRecords(storeRef.current.list());
      await refresh(app);
      return true;
    } catch (writeError) {
      setError(displayError(writeError));
      setRecords(storeRef.current.list());
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createDeal(): Promise<void> {
    if (!app || !account) return;
    const completed = await execute("create_deal", [
      createForm.partyB,
      createForm.priceUnit,
      BigInt(createForm.maxPrice),
      BigInt(createForm.latestDeadline),
      createForm.requirements,
      createForm.actionDigest,
    ], {
      read: async () => app.read("get_latest_deal_for", [account], true),
      verify: () => true,
    });
    if (!completed) return;
    const latest = await app.read("get_latest_deal_for", [account], true);
    if (typeof latest !== "string" || !latest) {
      setError({ category: "state-mismatch", message: "CREATE finalized but no creator-bound deal ID was read back." });
      return;
    }
    setDealId(latest);
    await refresh(app);
  }

  async function acceptParticipation(): Promise<void> {
    if (!app || !dealId) return;
    await execute("accept_participation", [
      dealId,
      acceptForm.priceUnit,
      BigInt(acceptForm.minPrice),
      BigInt(acceptForm.earliestDeadline),
      acceptForm.requirements,
    ], expectedDealState(app, dealId, ["CREATED_A_COMMITTED"]), expectedDealState(app, dealId, ["ACTIVE_B_COMMITTED"]));
  }

  async function submitOffer(): Promise<void> {
    if (!app || !dealId) return;
    await execute("submit_offer", [
      dealId,
      BigInt(offerForm.price),
      BigInt(offerForm.deadline),
      offerForm.actionDigest,
      offerForm.terms,
    ], expectedDealState(app, dealId, ["ACTIVE_B_COMMITTED"]), {
      read: async () => ({
        state: parseView(await app.read("get_deal", [dealId], true)).state,
        offer: parseView(await app.read("get_offer", [dealId], true)),
      }),
      verify: (value) => {
        const result = value as JsonRecord;
        const submittedOffer = result.offer as JsonRecord;
        return result.state === "OFFER_SUBMITTED"
          && submittedOffer.action_digest === offerForm.actionDigest;
      },
    });
  }

  async function assessOffer(): Promise<void> {
    if (!app || !dealId) return;
    const precondition = expectedDealState(app, dealId, ["OFFER_SUBMITTED"]);
    const pending = expectedDealState(app, dealId, [
      "ASSESSED_MATCH_PENDING_FINALITY",
      "ASSESSED_NO_MATCH_PENDING_FINALITY",
      "ASSESSED_INCONCLUSIVE_PENDING_FINALITY",
      "ASSESSED_MATCH_FINALIZED",
      "ASSESSED_NO_MATCH",
      "ASSESSED_INCONCLUSIVE",
    ]);
    const callback: ReadBackExpectation = {
      read: async () => ({ state: parseView(await app.read("get_deal", [dealId], true)).state }),
      verify: (value) => ["ASSESSED_MATCH_FINALIZED", "ASSESSED_NO_MATCH", "ASSESSED_INCONCLUSIVE"].includes(
        String((value as JsonRecord).state),
      ),
    };
    await execute("assess_offer", [dealId], precondition, pending, callback);
  }

  async function bindMatch(): Promise<void> {
    if (!app || !dealId || typeof deal?.offer_digest !== "string") return;
    const digest = deal.offer_digest;
    await execute("bind_match", [dealId, digest], expectedDealState(app, dealId, ["ASSESSED_MATCH_FINALIZED"]), expectedDealState(app, dealId, ["BINDING_PENDING_FINALITY", "BOUND"]), {
      read: async () => ({
        state: parseView(await app.read("get_deal", [dealId], true)).state,
        bound: await app.read("is_bound", [dealId, digest], true),
      }),
      verify: (value) => {
        const result = value as JsonRecord;
        return result.state === "BOUND" && result.bound === true;
      },
    });
  }

  useEffect(() => {
    if (!app || !dealId) return;
    void refresh(app).catch((readError) => setError(displayError(readError)));
  }, [app, dealId, refresh]);

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">GENLAYER / DEALMESH</p>
          <h1>One exact deal. Two committed parties.</h1>
          <p className="lede">
            Form a bilateral agreement from typed bounds and bounded natural-language constraints.
            Validators answer one question; the contract owns everything else.
          </p>
        </div>
        <div className="trust-pill">No backend adjudication · no money movement</div>
      </header>

      <section className="panel connection">
        <div className="section-heading"><span>01</span><h2>Connect to live contract</h2></div>
        <div className="grid two">
          <label>Network<select value={network} onChange={(event) => setNetwork(event.target.value as NetworkName)}><option value="studionet">Studio (multi-validator)</option><option value="testnetBradbury">Bradbury testnet</option></select></label>
          <label>Contract address<input value={contractAddress} onChange={(event) => setContractAddress(formValue(event))} placeholder="0x…" /></label>
        </div>
        <button className="primary" onClick={() => void connectWallet()}>{account ? `Connected ${account.slice(0, 8)}…${account.slice(-6)}` : "Connect wallet"}</button>
        <p className="micro">The browser wallet signs. Private keys never enter this application.</p>
      </section>

      <section className="panel">
        <div className="section-heading"><span>02</span><h2>Party A creates the commitment</h2></div>
        <div className="grid two">
          <label>Party B wallet<input value={createForm.partyB} onChange={(event) => setCreateForm({ ...createForm, partyB: formValue(event) })} placeholder="0x…" /></label>
          <label>Price unit<input value={createForm.priceUnit} onChange={(event) => setCreateForm({ ...createForm, priceUnit: formValue(event) })} /></label>
          <label>Maximum price<input inputMode="numeric" value={createForm.maxPrice} onChange={(event) => setCreateForm({ ...createForm, maxPrice: formValue(event) })} /></label>
          <label>Latest deadline (Unix seconds)<input inputMode="numeric" value={createForm.latestDeadline} onChange={(event) => setCreateForm({ ...createForm, latestDeadline: formValue(event) })} /></label>
        </div>
        <label>Immutable Party A requirements<textarea value={createForm.requirements} onChange={(event) => setCreateForm({ ...createForm, requirements: formValue(event) })} /></label>
        <label>Exact execution-action digest<input value={createForm.actionDigest} onChange={(event) => setCreateForm({ ...createForm, actionDigest: formValue(event) })} /></label>
        <button onClick={() => void createDeal()} disabled={busy || !account}>Create deal</button>
      </section>

      <section className="panel">
        <div className="section-heading"><span>03</span><h2>Party B accepts participation</h2></div>
        <label>Deal ID<input value={dealId} onChange={(event) => setDealId(formValue(event))} placeholder="Paste or load a live deal ID" /></label>
        <div className="grid two">
          <label>Price unit<input value={acceptForm.priceUnit} onChange={(event) => setAcceptForm({ ...acceptForm, priceUnit: formValue(event) })} /></label>
          <label>Minimum price<input inputMode="numeric" value={acceptForm.minPrice} onChange={(event) => setAcceptForm({ ...acceptForm, minPrice: formValue(event) })} /></label>
          <label>Earliest deadline<input inputMode="numeric" value={acceptForm.earliestDeadline} onChange={(event) => setAcceptForm({ ...acceptForm, earliestDeadline: formValue(event) })} /></label>
        </div>
        <label>Immutable Party B requirements<textarea value={acceptForm.requirements} onChange={(event) => setAcceptForm({ ...acceptForm, requirements: formValue(event) })} /></label>
        <button onClick={() => void acceptParticipation()} disabled={busy || !dealId}>Accept participation</button>
      </section>

      <section className="panel">
        <div className="section-heading"><span>04</span><h2>Submit and assess one exact offer</h2></div>
        <div className="grid two">
          <label>Offer price<input inputMode="numeric" value={offerForm.price} onChange={(event) => setOfferForm({ ...offerForm, price: formValue(event) })} /></label>
          <label>Offer deadline<input inputMode="numeric" value={offerForm.deadline} onChange={(event) => setOfferForm({ ...offerForm, deadline: formValue(event) })} /></label>
        </div>
        <label>Action digest (must equal Party A)<input value={offerForm.actionDigest} onChange={(event) => setOfferForm({ ...offerForm, actionDigest: formValue(event) })} /></label>
        <label>Bounded ordered terms JSON<textarea value={offerForm.terms} onChange={(event) => setOfferForm({ ...offerForm, terms: formValue(event) })} /></label>
        <div className="button-row"><button onClick={() => void submitOffer()} disabled={busy || !dealId}>Submit offer</button><button onClick={() => void assessOffer()} disabled={busy || deal?.state !== "OFFER_SUBMITTED"}>Assess exact offer</button></div>
        <p className="micro">MATCH is provisional until the assessment transaction and its contract-owned finalized callback complete.</p>
      </section>

      <section className="panel state-panel">
        <div className="section-heading"><span>05</span><h2>Live contract state</h2></div>
        <div className="state-grid"><div><span>Deal state</span><strong>{String(deal?.state ?? "—")}</strong></div><div><span>Verdict</span><strong className={assessment?.verdict === "MATCH" ? "match" : ""}>{String(assessment?.verdict ?? "—")}</strong></div><div><span>Final authorization</span><strong className={bound ? "match" : "muted"}>{bound ? "BOUND" : "not bound"}</strong></div></div>
        {deal?.state === "ASSESSED_MATCH_FINALIZED" && <button className="primary" onClick={() => void bindMatch()} disabled={busy}>Accept exact assessed offer</button>}
        {dealId && <button className="quiet" onClick={() => void refresh()} disabled={busy}>Refresh live state</button>}
        {offer && <p className="digest">Offer digest: <code>{String(offer.offer_digest)}</code></p>}
      </section>

      {(progress || error) && <section className="panel activity"><div className="section-heading"><span>LIVE</span><h2>Transaction monitor</h2></div>{progress && <p><b>{progress.method}</b> · {progress.status}{progress.hash && <code>{progress.hash}</code>}</p>}{error && <p className={`error ${error.category}`}><b>{error.category}</b> · {error.message}</p>}<p className="micro">Every write follows precondition read → one broadcast → immediate hash persistence → same-hash finality reconciliation → state read-back. Uncertainty never triggers a rebroadcast.</p></section>}

      <section className="panel records"><div className="section-heading"><span>LOG</span><h2>Persisted transaction hashes</h2></div>{records.length === 0 ? <p className="muted">No local transaction records yet.</p> : records.slice().reverse().map((record) => <div className="record" key={record.id}><span>{record.method}</span><b>{record.status}</b><code>{record.hash ?? "unknown submission — manual recovery"}</code></div>)}</section>
    </main>
  );
}
