# DealMesh

## Product

DealMesh is a complete GenLayer Project for forming exact bilateral agreements
between two wallet parties. Its application-specific Intelligent Contract
owns immutable commitments, bounded semantic consensus, finalized binding,
and exact downstream authorization. The complete user-facing workflow stores
typed bounds and hashes and exposes authorization only for the exact deal and
offer pair that passed the contract state machine.

It never moves money, executes an action, selects financial parameters, ranks
offers, or lets a model create or alter terms. The frontend is a wallet-backed
GenLayerJS application; it does not compute or override authorization.

## Problem

Two parties can agree on typed bounds while expressing important operational
requirements in bounded natural language. A centralized backend or one AI
provider should not unilaterally decide whether one exact offer satisfies both
parties.

The authoritative question is:

> Does this exact submitted offer satisfy both immutable requirement sets?

The only semantic result is `MATCH`, `NO_MATCH`, or `INCONCLUSIVE`. The model
cannot create terms, select a price or deadline, propose a counteroffer, or
produce an action.

## Why GenLayer

Sender identity, immutable storage, canonicalization, hashes, schemas, bounds,
and state transitions are deterministic contract responsibilities. The
remaining question is the bounded interpretation of the two requirement texts
against the exact offer. GenLayer supplies independent validator execution and
consensus for that semantic remainder.

## How it works

1. Party A creates a deal for Party B with bounded requirements, typed bounds,
   a price unit, and an exact action digest.
2. Party B accepts and commits its own bounded requirements and compatible
   typed bounds.
3. A or B submits one exact bounded offer. The contract validates every field,
   canonicalizes terms, and stores the offer digest.
4. Validators independently answer the fixed semantic question. Strict
   parsing accepts only `{"verdict":"MATCH"}`, `{"verdict":"NO_MATCH"}`, or
   `{"verdict":"INCONCLUSIVE"}`.
5. The assessment is advanced by an internal `on="finalized"` callback. A
   `MATCH` can be bound only after that callback has finalized successfully.
6. The non-submitting party requests binding for the exact `(deal_id,
   offer_digest)`. The internal finalized callback stores `BOUND` and an
   agreement digest.

`NO_MATCH` and `INCONCLUSIVE` never authorize binding. Malformed model output,
validator disagreement, timeout, or execution failure is a technical failure,
not a semantic verdict and has no fallback.

## Architecture

- The contract owns sender identity, immutable commitments, canonical bytes,
  hashes, typed admissibility, semantic consensus, finality callbacks, exact
  offer identity, and binding authorization.
- The frontend uses a read client and a wallet-backed write client. It submits
  once, persists the returned hash immediately, waits for `FINALIZED`, checks
  `FINISHED_WITH_RETURN`, reads state back exactly, and recovers by known hash
  without rebroadcasting.
- The contract accepts no external evidence or arbitrary URL in this version.
  Participant-authored requirement text is bounded and treated as untrusted
  data inside the semantic prompt.

See [`docs/architecture.md`](docs/architecture.md),
[`docs/security-model.md`](docs/security-model.md), and
[`docs/evidence-model.md`](docs/evidence-model.md).

## Use

DealMesh is intended for repeated pre-execution agreements between a human,
agent, or agent-human pair: an operating window, service condition, or exact
execution action.

The action digest is an identifier only. DealMesh does not inspect or execute
the action body. Plain participant text is on-chain and not private.

## Live proof

The repository contains the application-specific production contract, the
complete wallet-backed user-facing frontend workflow, deterministic direct
tests, mocked semantic/validator tests, persistence and recovery tests, and a
finalized-only callback authority probe. Existing hosted implementations
exercised multi-validator semantics and finalized callbacks, but the preserved
repository evidence does not contain sufficient immutable receipts or hashes
to independently prove a final `BOUND` authorization. Local Studio remains
blocked by the validator infrastructure described below.

Bradbury has a finalized, successfully executed deployment at
`0xCEFf63f9d66b4F60E854Ef3Eb4d2a35096037247` from deployment transaction
`0x90adf6a255c996331e1186553e4e687d2548635a56fcf427d4ed82e04ba66397`.
Attempt 4 returned `0xb90302aae0826778cb05bd503ce3ebc61a40b812f8b8ccf89bdcd0dabf349a0f`
and finalized with `FINISHED_WITH_ERROR` / `CANONICALIZATION_FAILED` because
the action digest was encoded as an integer instead of a literal string. One
corrected attempt, `0x6fdc962873707ecfaccf2aedbd071a26fcbffe89473066747d3f2e9182caf0b0`,
was broadcast through GenLayerJS with the exact digest string and has
`AGREE` / `FINISHED_WITH_RETURN`, but remains `ACCEPTED` pending finality.
Bradbury exposes `CREATED_A_COMMITTED` for that accepted transaction in the
`LATEST_FINAL` read view, but this is not treated as a finalized lifecycle
authorization. No accept, offer, semantic assessment, finalized callback,
`MATCH`, `BOUND`, or `is_bound` proof exists, and the live lifecycle remains
incomplete.

Run the local checks with:

```powershell
$env:GENVM_VERSION='v0.3.0-rc7'
python -m pytest tests/direct tests/mocked -q
genvm-lint check contracts/deal_mesh.py
Push-Location frontend; npm ci; npm test; npm run build; Pop-Location
```

The Studio test requires a running multi-validator Studio:

```powershell
$env:DEALMESH_STUDIO='1'
python -m pytest tests/integration -m studio -q
```

The hosted Studio evidence is ephemeral test-network evidence, not a public
deployment or production economic integration. Local Studio is currently
blocked by its empty validator registry; this does not invalidate the recorded
hosted semantic/callback exercise. Release remains blocked because the final
Bradbury create attempt failed before deal creation and the frontend could not
be published: no authenticated Vercel session or usable GitHub Pages
configuration is available. No later Bradbury write was sent.

## Gate status

| Gate | Status |
| --- | --- |
| STAGE_0_GATE | PASS |
| IMPLEMENTATION_GATE | PASS |
| DETERMINISTIC_CI_GATE | PASS |
| STUDIO_INTEGRATION_GATE | PASS — hosted multi-validator Studio implementation evidence; no independent BOUND receipt proof |
| LOCAL_STUDIO_HEALTH | BLOCKED — zero configured local validators |
| RELEASE_GATE | BLOCKED - corrected create finality pending and unavailable public hosting |

The hosted test implementations exercised multi-validator semantics and
finalized callbacks, but the preserved repository evidence does not contain
sufficient immutable receipts or hashes to independently prove a final
`BOUND` authorization. Bradbury attempt 4 failed from the integer-encoded
action digest; corrected attempt 5 is accepted with a created record visible
in the read view but is not yet finalized, so no public authorization or
frontend URL exists.

## Security/trust model

The trust order is sender authentication, canonicalization, content-integrity
hashing, schema and bounds validation, deterministic admissibility, semantic
adjudication, validator consensus, native finality, and exact `BOUND`
authorization. Participant text and model output are untrusted. The contract
rejects malformed output, prompt-injection attempts that do not produce the
strict enum, unauthorized callers, stale digests, pending finality, and every
non-exact consumer key. See [`docs/security-model.md`](docs/security-model.md)
and [`docs/evidence-model.md`](docs/evidence-model.md).

## Limitations

V1 does not provide legal identity, truth or safety guarantees, external-world
evidence, web access, payments, escrow, payouts, settlement, action execution,
counteroffers, negotiation, delivery disputes, or privacy for on-chain text.
An action digest commits only an identifier; DealMesh never reads the action
body. An `INCONCLUSIVE` verdict is a valid semantic result, while model,
consensus, execution, wallet/RPC, timeout, and state-mismatch failures remain
technical failures with no fallback verdict.

## Developer/API detail

Writes:

- `create_deal(party_b, price_unit, a_max_price, a_latest_deadline, a_requirements, action_digest)`
- `accept_participation(deal_id, price_unit, b_min_price, b_earliest_deadline, b_requirements)`
- `submit_offer(deal_id, price, deadline, action_digest, terms)`
- `assess_offer(deal_id)`
- internal-only `finalize_assessment(...)`
- `bind_match(deal_id, offer_digest)`
- internal-only `finalize_binding(...)`

Views:

- `get_latest_deal_for(party)`
- `get_deal(deal_id)`
- `get_offer(deal_id)`
- `get_assessment(deal_id)`
- `is_bound(deal_id, offer_digest)`

The exact state machine and canonical encoding are frozen in the architecture
document. `contracts/deal_mesh.py` is linted and semantically validated against
the pinned runner dependency declared in its first line.
