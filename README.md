# DealMesh

DealMesh is a reusable GenLayer Intelligent Contract for authorizing one exact
bilateral agreement between two wallet parties. It stores immutable
commitments, enforces typed bounds and hashes, asks validators one bounded
semantic question, and exposes authorization only for the exact deal and
offer pair that passed the contract state machine.

It never moves money, executes an action, selects financial parameters, ranks
offers, or lets a model create or alter terms. The frontend is a thin
GenLayerJS lifecycle client; it does not compute or override authorization.

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

## Use and limits

DealMesh is intended for repeated pre-execution agreements between a human,
agent, or agent-human pair: an operating window, service condition, or exact
execution action. It is not a marketplace, delivery dispute system, escrow,
payout service, financial oracle, or legal-entity verifier.

The action digest is an identifier only. DealMesh does not inspect or execute
the action body. Plain participant text is on-chain and not private.

## Validation and proof status

The repository contains the production contract, deterministic direct tests,
mocked semantic/validator tests, GenLayerJS lifecycle code, persistence and
recovery tests, and a five-validator-shaped Studio integration test.

Run the local checks with:

```powershell
$env:GENVM_VERSION='v0.2.12'
python -m pytest tests/direct tests/mocked -q
genvm-lint check contracts/deal_mesh.py
Push-Location frontend; npm ci; npm test; npm run build; Pop-Location
```

The Studio test requires a running local multi-validator Studio:

```powershell
$env:DEALMESH_STUDIO='1'
python -m pytest tests/integration -m studio -q
```

No Bradbury write is sent until all preflight checks, including Studio, are
green. A successful local test is not a claim that a Bradbury deployment or
production economic integration exists.

## Developer/API surface

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
