# DealMesh release submission

## Product

DealMesh is a complete GenLayer Project for forming exact bilateral agreements
between two named wallet parties, including autonomous agents. Its
application-specific Intelligent Contract owns immutable commitments, bounded
semantic consensus, finalized binding, and exact downstream authorization.

## Contribution type and trust problem

Contribution type: **Project**.

Two parties can commit typed economic/operational bounds while expressing
non-numeric requirements in bounded natural language. A centralized backend or
one AI provider should not unilaterally decide whether an exact offer satisfies
both parties. The authoritative question is only whether the exact submitted
offer satisfies both immutable requirement sets. The only business verdicts are
`MATCH`, `NO_MATCH`, and `INCONCLUSIVE`.

## Why GenLayer and architecture

Identity, authorization, immutable commitments, canonical encoding, SHA-256
digests, typed bounds, offer lifecycle, and exact binding are deterministic
contract responsibilities. GenLayer is used for the narrow residual semantic
question, evaluated independently by validators and parsed strictly. Malformed
model output and validator disagreement remain technical failures.

The lifecycle is `create_deal` → `accept_participation` → `submit_offer` →
`assess_offer` → finalized assessment callback → require `MATCH` → Party B
`bind_match` → finalized binding callback → `BOUND`. A consumer can authorize
only the exact `(deal_id, offer_digest)` pair in the finalized `BOUND` state.
The frontend reads live state, broadcasts once, persists each hash immediately,
reconciles that same hash to `FINALIZED` with successful execution, reads exact
state back, and never rebroadcasts after uncertainty.

## Repository and Bradbury evidence

Repository: `GIFTEDLOV/dealmesh`.

- Network: GenLayer Bradbury Testnet, chain ID `4221`.
- RPC: `https://rpc-bradbury.genlayer.com`.
- Contract: `0xCEFf63f9d66b4F60E854Ef3Eb4d2a35096037247`.
- Deployment transaction: `0x90adf6a255c996331e1186553e4e687d2548635a56fcf427d4ed82e04ba66397`.
- Deployment status: `FINALIZED`.
- Deployment execution: `FINISHED_WITH_RETURN` with result `AGREE`.
- Contract source: `contracts/deal_mesh.py`, 25,773 bytes,
  SHA-256 `ab86f3748afd58adee1246442ac125f098e64eb4dba3a690113555fd85cace6d`.

The live DealMesh lifecycle has not started. No `create_deal` hash exists. No
Bradbury `MATCH`, callback, `BOUND`, or `is_bound` evidence exists. Three
`create_deal` requests were explicitly rejected before hash with RPC `-32005`
capacity errors; latest and pending deployer nonce remained `203`, and the
creator’s latest deal remained empty. Release is blocked by Bradbury capacity
and unfinished live-proof/release packaging.

Existing hosted Studio implementations exercised multi-validator semantics and
finalized callbacks. The preserved repository evidence does not contain enough
immutable receipts/hashes to independently prove a final hosted `BOUND`
authorization; it is not presented as two complete BOUND lifecycles.

## Verification and security

The checked baseline uses runner
`1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` and GenVM
`v0.3.0-rc7`. Deterministic direct tests, mocked semantic tests, frontend
tests/build, GenVM checks, offline evidence verification, source hashing, and
secret scanning are CI gates. The trust order is sender authentication,
canonicalization, content integrity, schema/bounds validation, deterministic
admissibility, semantic adjudication, consensus, native finality, and exact
authorization. Private keys and seed phrases are never handled by the app.

## Limitations and capacity blocker

V1 does not provide legal identity, external-world evidence, web access,
payments, escrow, payouts, settlement, action execution, negotiation,
counteroffers, delivery disputes, or privacy for on-chain text. An action digest
identifies committed action bytes; DealMesh does not inspect or execute them.
The Bradbury release cannot honestly claim live authorization until the capacity
problem is clarified and one complete lifecycle is independently reconciled.

Reserved for the later authorized live-proof update:

- final deployment/lifecycle/callback transaction hashes and explorer links;
- final verdict, `BOUND` state, exact and wrong-digest `is_bound` results;
- public frontend URL.

See `artifacts/dealmesh-final-release-proof.json` and
`docs/genlayer-bradbury-capacity-report.md` for the machine-readable evidence
and the capacity escalation report.
