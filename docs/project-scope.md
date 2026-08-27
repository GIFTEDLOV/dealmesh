# DealMesh Project scope

## Classification

DealMesh is a GenLayer PROJECT contribution. The repository now contains the
application-specific Intelligent Contract, wallet-backed GenLayerJS
frontend, deterministic/mocked tests, and a genuine multi-validator Studio
finality probe. Bradbury deployment remains a separate release step.

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
are green. Hosted Studio has proved finalized-only child creation, the
same-contract callback pattern, and the complete bilateral DealMesh lifecycle
with ephemeral test state. No public production authorization or Bradbury
deployment is claimed; those remain separately gated release activities.
