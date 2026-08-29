# DealMesh Project scope

## Classification

DealMesh is a GenLayer PROJECT contribution. The repository now contains the
application-specific Intelligent Contract, wallet-backed GenLayerJS
frontend, deterministic/mocked tests, and a genuine multi-validator Studio
finality probe. Bradbury deployment is finalized and successfully executed,
and the single locked live lifecycle has independently reached `BOUND` with
exact downstream authorization checks. Public frontend hosting remains
pending because no authenticated provider is available.

## In scope

- two named wallet parties, including autonomous agents;
- immutable A and B natural-language commitments and typed price/deadline bounds;
- one exact offer with exact action digest and bounded ordered terms;
- native sender authorization;
- NFC/LF canonicalization, UTF-8 bounds, SHA-256 commitment and offer digests;
- deterministic interval and action-digest checks;
- one bounded semantic consensus assessment;
- strict exact JSON verdict parsing;
- distinct business, integrity, model, consensus, execution, wallet/RPC, and state-mismatch errors;
- finalized-only assessment and binding callbacks;
- exact finalized-state is_bound(deal_id, offer_digest) authorization;
- frontend transaction hash persistence, refresh recovery, finality, execution, callback, and read-back handling.

## Explicitly out of scope

- procurement marketplace behavior or bid ranking;
- counteroffers, negotiation, winner selection, or task delivery;
- post-delivery disputes, fault attribution, or external-world evidence;
- generic compliance gates or chatbot behavior;
- arbitrary URLs, web access, backend-owned adjudication, or hidden verdicts;
- tokens, escrow, payments, payouts, settlement, or money movement;
- action bodies, action execution, arbitrary downstream writes, or an action registry;
- private-key or seed-phrase handling.

## Differentiation

DealMesh is pre-execution agreement formation between two identified parties.
TenderCouncil compares procurement bids. TaskEscrow handles delivery disputes and
payout. AgentFault attributes responsibility after a workflow. ClauseGate is a
unilateral general-rule gate. CommitGate and CommitSeal certify software
changes. PatchBond and ExploitCouncil handle security remediation. UptimeBond
handles SLA evidence and settlement. ClaimCouncil remains deferred because an
authoritative external-evidence design is not honest within the build window.

## Release proof and current status

The contract passes direct linter validation under GenVM v0.3.0-rc7 with the
pinned 1jb runner. The deterministic/mocked contract suite and frontend suite
are green. The hosted Studio probe has proved finalized-only child creation and
the same-contract callback pattern with ephemeral test state. Two hosted
multi-validator implementations exercised the bilateral DealMesh lifecycle,
semantic execution, and finalized callback assertions, but preserved evidence
does not contain sufficient immutable receipts or hashes to independently prove
a hosted final `BOUND` authorization. Local Studio is currently blocked by an
empty validator set, but this is distinct from the hosted implementation
evidence. Bradbury deployment is finalized and successfully executed at
`0xCEFf63f9d66b4F60E854Ef3Eb4d2a35096037247`. Attempt 4 returned
`0xb90302aae0826778cb05bd503ce3ebc61a40b812f8b8ccf89bdcd0dabf349a0f` and
failed with `CANONICALIZATION_FAILED` because its action digest was encoded as
an integer. Corrected attempt 5 returned
`0x6fdc962873707ecfaccf2aedbd071a26fcbffe89473066747d3f2e9182caf0b0` with a
literal string digest and finalized successfully. The subsequent locked
Bradbury lifecycle finalized `MATCH`, both internal callbacks, `BOUND`, exact
`is_bound=true`, and wrong-digest `false`; all hashes and read-backs are in
the release manifest. Release packaging remains blocked only by unavailable
public hosting.
