# DealMesh

## Product

DealMesh is a planned GenLayer Project application for forming one exact,
bilateral agreement between two named wallet parties. Each party commits a
bounded natural-language requirement set plus typed operational bounds. One
party submits one exact offer. GenLayer validators independently assess the
same bounded evidence and the application exposes a permanent authorization
only for the exact deal and offer that both parties accepted.

This repository is at Stage 0. It contains the product contract, trust model,
architecture, and tooling baseline only. There is no production Intelligent
Contract, frontend, deployment, or live proof yet.

## Problem

Parties can agree on typed bounds while expressing important non-numeric
requirements in natural language. A centralized backend or one AI provider
should not unilaterally decide that an exact proposed deal satisfies both
parties' committed requirements.

DealMesh narrows the authoritative question to:

> Does this exact submitted offer satisfy both immutable party constraint sets?

The model never creates, rewrites, negotiates, ranks, or selects deal terms.
It never chooses a price, deadline, counterparty, payment, payout, action, or
any other numerical value.

## Why GenLayer

Deterministic contract code can authenticate senders, bind immutable data,
validate typed ranges, calculate digests, and expose state. It cannot by
itself interpret whether bounded natural-language requirements are satisfied.
DealMesh puts only that semantic remainder inside a bounded non-deterministic
execution and asks validators to reach consensus on the exact enum result.

This is a real neutral-settlement problem: the parties should not have to
trust DealMesh's server, a single LLM vendor, or the offer submitter for the
authoritative interpretation. The meaningful on-chain consequence is an
exact, bilateral agreement authorization that downstream agents or
integrations can query synchronously.

## How it works

1. Party A creates a deal, nominates Party B, and commits bounded natural
   language, a maximum price, a latest acceptable Unix-second deadline, a
   price unit, and an exact execution-action digest.
2. Party B accepts participation and commits bounded natural language, a
   minimum price, an earliest acceptable deadline, and the same price unit.
3. Either party submits one bounded offer containing a price, deadline,
   action digest, and bounded terms. The contract checks all typed and
   integrity constraints deterministically.
4. GenLayer validators independently assess only the semantic compatibility
   of the exact offer with both immutable requirement texts. The only valid
   model result is `{"verdict":"MATCH"}`, `{"verdict":"NO_MATCH"}`, or
   `{"verdict":"INCONCLUSIVE"}`.
5. A `MATCH` assessment remains provisional until its exact transaction is
   `FINALIZED`, its execution succeeded, and the expected stored state is
   read back. Only then may the non-submitting party request binding.
6. The contract stores `BOUND` for the exact `(deal_id, offer_digest)`. A
   downstream consumer can query that pair; every other offer or digest is
   rejected.

`NO_MATCH` and `INCONCLUSIVE` never authorize binding. Malformed model output
is a technical/model failure, not a business result, and has no fallback.

## Architecture

The planned system has three layers:

- The frontend connects a wallet, displays live contract state, submits each
  write once, persists every returned transaction hash immediately, recovers
  pending hashes after refresh, waits for `FINALIZED`, checks execution
  success, and reads state back.
- The Intelligent Contract owns party authorization, immutable commitments,
  canonicalization, hashes, typed admissibility, the bounded semantic call,
  strict verdict parsing, the assessment record, binding checks, and the
  read-only consumer interface.
- GenLayer validators independently run the same bounded semantic question
  and compare only the exact verdict enum. No validator authenticates the
  parties; wallet signatures and on-chain sender checks do that.

The full boundary and state machine are in
[`docs/architecture.md`](docs/architecture.md). The project is deliberately
not a marketplace, bid-ranking system, delivery dispute system, chatbot, or
cosmetic frontend around a contract.

## Use

DealMesh is intended for repeated pre-execution agreements such as an agent
and a human agreeing on an exact operating window, service conditions, or
execution action before work begins. It is useful when the parties need a
shared interpretation of natural-language constraints and a downstream
system must authorize exactly one agreed action.

It does not rank competing bidders, evaluate an external-world fact, inspect
a completed deliverable, attribute fault, move money, hold escrow, settle a
payout, or run a dispute process. V1 accepts no external evidence or
arbitrary URL.

## Live proof

There is no live proof in Stage 0. No contract has been implemented or
deployed, no frontend exists, no Bradbury transaction has been sent, and no
multi-validator result is being claimed. Stage 1 must prove the design with
deterministic tests, mocked consensus tests, and a separately recorded live
test only if the implementation is ready and the network is available.

## Security/trust model

The evidence is participant-authored and wallet-authenticated on-chain data:
Party A's immutable constraints, Party B's immutable constraints, the exact
typed offer, canonical hashes, and authenticated sender identities. The trust
order is:

`sender authentication → canonicalization → content integrity/hash binding →
schema and bounds validation → deterministic admissibility → semantic
adjudication → validator consensus → native finality → BOUND authorization`

Model output is untrusted. Requirement and offer text is untrusted evidence
and is delimited as data, never as instructions. The parser rejects anything
other than one JSON object with exactly one `verdict` key and one exact enum
value. The future implementation must bound every text field and collection,
reject URL-shaped external references, keep no private keys, and preserve
distinct error classes. Details are in
[`docs/security-model.md`](docs/security-model.md) and
[`docs/evidence-model.md`](docs/evidence-model.md).

## Limitations

Natural-language consensus proves validator agreement about an interpretation;
it does not prove that a party's requirements are objectively true, legally
binding, or fair. The model sees only the bounded participant-authored data.
There is no privacy guarantee, external evidence, currency settlement,
deadline clock enforcement, or execution of the action digest in V1.

Native finality is a protocol property. A frontend may enable the follow-on
binding step only after the assessment transaction is finalized, successful,
and verified by a state read-back. A user-supplied flag or client assertion
is not proof of finality; Stage 1 must confirm the supported GenLayer
finality-aware integration before claiming stronger enforcement.

## Developer/API detail

The planned write surface is:

- `create_deal(party_b, price_unit, a_max_price, a_latest_deadline,
  a_requirements, action_digest)` — Party A only.
- `accept_participation(deal_id, price_unit, b_min_price,
  b_earliest_deadline, b_requirements)` — nominated Party B only.
- `submit_offer(deal_id, price, deadline, action_digest, terms)` — either
  party, once, after both commitments exist.
- `bind_match(deal_id, offer_digest)` — the party that did not submit the
  offer, only after the app's finalized-assessment workflow succeeds.

The planned view surface includes `get_deal`, `get_offer`,
`get_assessment`, and `is_bound(deal_id, offer_digest)`. The exact canonical
encoding, digests, parser, error taxonomy, and transaction recovery contract
are specified before implementation in the documents under `docs/`.

The current runtime baseline is recorded in
[`docs/runtime-baseline.md`](docs/runtime-baseline.md). Stage 0 intentionally
contains no contract dependency pin, frontend package lock, deployment
script, or executable production API.
