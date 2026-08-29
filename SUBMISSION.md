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

The three earlier `create_deal` requests were explicitly rejected before hash
with RPC `-32005` capacity errors. Attempt 4 returned
`0xb90302aae0826778cb05bd503ce3ebc61a40b812f8b8ccf89bdcd0dabf349a0f` and
finalized with `FINISHED_WITH_ERROR` / `CANONICALIZATION_FAILED` because the
action digest was encoded as an integer. Corrected attempt 5 returned
`0x6fdc962873707ecfaccf2aedbd071a26fcbffe89473066747d3f2e9182caf0b0` using
the exact literal digest string and finalized successfully as
`CREATED_A_COMMITTED`. The single locked lifecycle then finalized with:

- accept: `0x9b4062e1763ec10b2c8709f4a35d85c97343bb9913aba41043e4ab36e2186a8f`;
- offer: `0x77a1751faddc9b6a952ea16e2895ea8f9d69590e4f3217b471964321e0689c60`,
  digest `0xe9967bcc89af22d77068dbe374f0d6e11b5f5941b832a4ee00d6c2c71620f6b1`;
- assessment: `0xbc936bbf937a3ec06095d518c8f47999ddb591c653c4840523037e68d194b796`,
  finalized callback `0x7fdba86d51bd2f48f78b12c02148a137a0cba2dec39cc57b0b88659dd963a333`,
  verdict `MATCH`;
- binding: `0xe59593d0c117799ea512c2152b2609e2a08f4897a500709c3ccc9bc047881dc5`,
  finalized callback `0x5b004fd398c7d3988c615ff077d018ce6ae7c6fd0161d6b24144a1050704fdb6`.

The final contract read-back is `BOUND`; exact `is_bound` is `true` and the
deliberate wrong digest returns `false`. Public frontend deployment remains
blocked because Vercel is unauthenticated and the configured GitHub CLI token
is invalid.

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
The Bradbury release now has independently reconciled live authorization: the
locked lifecycle reached `BOUND`, and exact and wrong-digest authorization
reads returned `true` and `false`. The remaining release blocker is public
frontend hosting, not lifecycle evidence.

Reserved for a later hosting update:

- public frontend URL and deployment identifier (not yet available because no
  authenticated hosting provider is configured).

See `artifacts/dealmesh-final-release-proof.json` and
`docs/genlayer-bradbury-capacity-report.md` for the machine-readable evidence
and the capacity escalation report.
