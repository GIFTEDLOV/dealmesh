# DealMesh Project scope

## Track classification

DealMesh is a GenLayer `PROJECT` contribution. The intended release is a
complete user-facing application with an Intelligent Contract, wallet-backed
frontend, live state reads, real writes, transaction recovery, finality-aware
progress, and a downstream authorization query.

Stage 0 deliberately delivers none of that runtime functionality. It freezes
the product and trust boundary so Stage 1 can implement it without drifting
into a different project.

## In scope for the future V1

- two named wallet parties, including autonomous agents controlled by wallets;
- Party A's immutable bounded requirements, maximum price, latest deadline,
  price unit, and exact action digest;
- Party B's immutable bounded requirements, minimum price, earliest deadline,
  and matching price unit;
- one exact bounded offer with typed price, typed deadline, exact action
  digest, and bounded terms;
- deterministic identity, schema, canonicalization, digest, range, state, and
  authorization checks;
- one bounded GenLayer semantic assessment with `MATCH`, `NO_MATCH`, or
  `INCONCLUSIVE`;
- strict model-output parsing and custom validator consensus;
- finality-aware assessment read-back and exact bilateral binding; and
- a synchronous, read-only `is_bound(deal_id, offer_digest)` consumer
  interface.

## Explicitly out of scope

- procurement marketplace behavior;
- competitive bid ranking, winner selection, or counteroffers;
- task delivery, milestone, or post-execution dispute adjudication;
- fault or responsibility attribution;
- generic compliance gates or a chatbot;
- external evidence, web access, arbitrary URLs, or real-world fact claims;
- token issuance, escrow, payments, payouts, settlement, or money movement;
- action execution, callbacks, arbitrary downstream writes, or an action
  registry;
- hidden backend adjudication or a backend-owned verdict;
- private-key or seed-phrase handling; and
- a deployment or write transaction during Stage 0.

## Product differentiation

DealMesh is pre-execution bilateral agreement formation between two
identified parties. TenderCouncil compares procurement bids. TaskEscrow
handles post-delivery disputes and payout. AgentFault attributes
responsibility after a workflow. ClauseGate evaluates a unilateral general
rule. CommitGate and CommitSeal certify software changes or releases.
PatchBond and ExploitCouncil focus on software-security findings and
remediation. UptimeBond focuses on SLA evidence and settlement. DealMesh is
none of those: its result is an exact agreement authorization before action.

ClaimCouncil remains deferred because it would require an authoritative
external-evidence design that a 24-hour build cannot honestly provide.

## Release proof standard

Before a future release is called complete, it must show:

1. direct tests for canonicalization, hashes, bounds, sender checks, state
   transitions, digest binding, and every error class;
2. mocked tests for valid verdicts, malformed output, prompt-injection text,
   validator disagreement, and `INCONCLUSIVE`;
3. integration coverage for transaction status, finality, execution result,
   read-back, recovery, and no-rebroadcast behavior; and
4. a live proof recorded separately only after the current network and SDK
   baseline are actually validated.

No Stage 0 file implies that these tests or proofs already pass.
