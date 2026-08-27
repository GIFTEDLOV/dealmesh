# DealMesh architecture

This is the Stage 0 implementation contract. Names and limits below are
intended to be frozen before Stage 1 code is written. The contract and app
must not expand the semantic question without revisiting the candidate gate.

## Authoritative semantic question

For the exact stored commitment data and the exact submitted offer:

> Does this exact offer satisfy both Party A's immutable natural-language
> requirements and Party B's immutable natural-language requirements?

The deterministic layer has already checked the typed price, typed deadline,
party identities, action digest, bounds, canonical form, and state. The model
must assess only semantic compatibility of the bounded requirement texts and
bounded offer terms. It must not calculate or select a price or deadline,
change the action digest, choose a party, propose a counteroffer, or produce
an action.

The only authoritative model result is one of:

```json
{"verdict":"MATCH"}
{"verdict":"NO_MATCH"}
{"verdict":"INCONCLUSIVE"}
```

`INCONCLUSIVE` is a valid business verdict with no binding consequence.
Malformed output, a failed model call, validator disagreement, an
undetermined transaction, or an execution failure is not any of these three
business results.

## Planned state machine

The V1 contract permits one offer assessment per deal. This keeps the
authorization exact and avoids a hidden negotiation loop.

```text
CREATED_A_COMMITTED
        |
        | nominated Party B accepts and commits B constraints
        v
ACTIVE_B_COMMITTED
        |
        | either party submits one deterministically admissible offer
        v
ASSESSMENT_PENDING
        |
        | consensus transaction executes and stores exact offer + verdict
        +------------------------------+
        |                              |
        v                              v
ASSESSED_MATCH_PENDING_FINALITY   ASSESSED_NO_MATCH
        |                              |
        | exact assessment tx          | terminal; no binding
        | FINALIZED + success          |
        | + expected state read-back   |
        v                              |
ASSESSED_MATCH_FINALIZED           ASSESSED_INCONCLUSIVE
        |                              |
        | non-submitting party         | terminal; no binding
        | accepts exact pair            |
        v                              |
BOUND
```

`ASSESSMENT_PENDING` is the user-facing state while the assessment write is
being processed; a transaction that has not reached successful consensus does
not create a business result. The on-chain assessment record may be visible
at `ACCEPTED`, but `MATCH` remains provisional until native finality is
confirmed for that exact transaction.

The finality transition is deliberately split from the contract's logical
checks. The `bind_match` write must require the stored state to be an exact
match, the exact offer digest, and the caller to be the other party. The app
must not call it until it has observed `FINALIZED`, verified successful
execution, and read back the expected record. The contract must never accept
a caller-provided `finalized=true` value as proof. Stage 1 must confirm
whether the current GenLayer APIs provide a stronger native finality context;
if not, the app-gated flow is the maximum honest guarantee and stronger
claims are prohibited.

## Sender authorization

Addresses are canonical lowercase EVM-style `0x` plus 40 lowercase hex
characters. The contract obtains the authenticated sender from the native
message context, never from a user-supplied `sender` argument.

- `create_deal`: `sender == party_a`; `party_b` is nonzero and distinct.
- `accept_participation`: `sender == stored party_b`; it cannot be Party A.
- `submit_offer`: `sender` is exactly Party A or Party B, and both have
  committed constraints.
- `bind_match`: `sender` is exactly the party that did not submit the stored
  offer.
- Views do not infer authorization from display names. A display name is not
  a V1 identity field; the wallet address is the identity.

No method changes either party's committed constraint set, nominated party,
price unit, or action digest after it is stored. No method deletes or replaces
an offer or assessment.

## Typed constraints and offer bounds

The following limits are fixed for the first implementation candidate:

| Field | Type and bound | Deterministic rule |
| --- | --- | --- |
| `price_unit` | ASCII token, 1–16 bytes, `[A-Z0-9._-]+` | B's value must equal A's exact value. It is a label only; V1 moves no money. |
| `price`, `a_max_price`, `b_min_price` | unsigned integer, `0..10^18-1` | Require `b_min_price <= a_max_price` and `b_min_price <= price <= a_max_price`. |
| `a_latest_deadline`, `b_earliest_deadline`, `deadline` | Unix seconds, `1..4,102,444,800` (2100-01-01 UTC) | Require `b_earliest_deadline <= a_latest_deadline` and `b_earliest_deadline <= deadline <= a_latest_deadline`. No current-time check is performed. |
| requirements text | UTF-8, NFC, 1–4096 bytes after canonicalization | No NUL; no leading/trailing whitespace; CRLF/CR canonicalized to LF; no URL scheme or `www.` reference. |
| offer terms | ordered collection of 1–8 entries | Keys are unique, lowercase ASCII `[a-z0-9_]{1,32}` and strictly increasing; each value is canonical text of 1–512 bytes. |
| `action_digest` | exact lowercase `0x` + 64 hex characters | Offer value must equal A's immutable digest. The action body is not accepted or executed in V1. |

The contract rejects out-of-range or incompatible inputs before any
non-deterministic call. A client preflight is only a UX aid; the contract is
authoritative.

## Canonical payloads and digests

The implementation must not hash language-runtime object representations,
unordered maps, pretty-printed JSON, or user-controlled JSON key order. It
uses a versioned byte encoding:

- text is UTF-8 after the stated NFC/line-ending/whitespace rules;
- `enc_text(s)` is `S` + decimal UTF-8 byte length + `:` + the exact UTF-8
  bytes;
- `enc_u64(n)` is `U` + base-10 `n` + `;`, with no leading zero except `0`;
- `enc_hash(h)` is `H` + lowercase `0x` + 64 hex characters + `;`;
- an entry is `enc_text(key) + enc_text(value)`;
- the ordered terms collection is `enc_u64(count)` followed by entries in
  strictly increasing key order.

The field order is fixed and the version prefix is part of every preimage.
The conceptual preimages are:

```text
deal_preimage = "DealMesh/Deal/v1|"
  + enc_text(party_a)
  + enc_text(party_b)
  + enc_text(price_unit)
  + enc_text(a_requirements)
  + enc_u64(a_max_price)
  + enc_u64(a_latest_deadline)
  + enc_hash(action_digest)
  + enc_u64(party_a_creator_nonce)

party_a_constraints_preimage = "DealMesh/Constraints/v1|A|"
  + enc_text(party_a) + enc_text(price_unit)
  + enc_text(a_requirements) + enc_u64(a_max_price)
  + enc_u64(a_latest_deadline) + enc_hash(action_digest)

party_b_constraints_preimage = "DealMesh/Constraints/v1|B|"
  + enc_text(party_b) + enc_text(price_unit)
  + enc_text(b_requirements) + enc_u64(b_min_price)
  + enc_u64(b_earliest_deadline)

offer_preimage = "DealMesh/Offer/v1|"
  + enc_hash(deal_id)
  + enc_u64(price) + enc_u64(deadline)
  + enc_hash(action_digest)
  + enc_terms(terms)
```

`deal_id`, each party constraint digest, and `offer_digest` are
`SHA-256(preimage)` represented as lowercase `0x` plus 64 hex characters.
The exact deterministic SHA-256 primitive available in the selected GenVM
runtime must be confirmed by the Stage 1 linter/runtime test before code is
written; the algorithm and preimages must not change silently. The action
digest is supplied by Party A as an already computed exact digest; DealMesh
does not pretend to know the action body.

The downstream binding key is exactly `(deal_id, offer_digest)`. An optional
`agreement_digest` is `SHA-256("DealMesh/Bound/v1|" + enc_hash(deal_id) +
enc_hash(offer_digest))` and is an identifier, not a permission substitute.

## Semantic execution and parser

The deterministic code constructs one bounded prompt from the canonical
stored values. Requirement and offer text are enclosed in fixed data markers
and explicitly treated as untrusted evidence. The prompt says that typed
fields have already been checked and forbids changing, selecting, or
inventing any term. V1 does not use web access or arbitrary URLs.

The leader function calls the current GenLayer non-deterministic LLM API with
JSON response mode, then applies a strict parser. The validator function
independently runs the same bounded task over the same canonical input and
accepts the leader only when its own strict parsed enum equals the leader's
enum. This is a custom leader/validator comparison, not leader-output-only
validation and not strict equality over raw model text.

The strict parser must:

1. accept only a JSON text representation of one object (surrounding JSON
   whitespace is allowed, but no markdown fence or extra non-whitespace);
2. reject duplicate keys while parsing;
3. require object keys to be exactly `{"verdict"}`;
4. require the value to be a string exactly equal to `MATCH`, `NO_MATCH`, or
   `INCONCLUSIVE`, with case and spelling significant; and
5. raise a technical/model error for every other result. It never defaults to
   `MATCH`, `NO_MATCH`, or `INCONCLUSIVE`.

Only the accepted parsed enum is used by deterministic code. Model reasoning,
confidence, alternate terms, and validator intermediate answers are not
stored as business state.

## Planned public API

Writes:

- `create_deal(party_b, price_unit, a_max_price, a_latest_deadline,
  a_requirements, action_digest)`
- `accept_participation(deal_id, price_unit, b_min_price,
  b_earliest_deadline, b_requirements)`
- `submit_offer(deal_id, price, deadline, action_digest, terms)`
- `bind_match(deal_id, offer_digest)`

Views:

- `get_deal(deal_id)` returns immutable party identities, commitments,
  digests, state, and the stored offer/assessment references when present.
- `get_offer(deal_id)` returns the exact typed offer, canonical terms, and
  `offer_digest`.
- `get_assessment(deal_id)` returns the stored verdict, offer digest, and
  assessment transaction reference if present.
- `is_bound(deal_id, offer_digest)` returns true only for the exact stored
  `BOUND` pair; all other pairs return false.

The concrete ABI and storage types must be generated and linted in Stage 1.
The above names are the scope boundary, not an assertion that the ABI exists
today.

## Transaction lifecycle

The frontend uses separate read and wallet-backed write GenLayerJS clients.
For every write it:

1. performs read-only preflight and shows the user the exact canonical values;
2. invokes `writeContract` once;
3. persists the returned transaction hash immediately, before any polling;
4. recovers persisted hashes after refresh and polls by hash, never by
   reconstructing or rebroadcasting calldata;
5. displays `PENDING`, `PROPOSING`, `COMMITTING`, `REVEALING`, `ACCEPTED`,
   finality/appeal states, and terminal failures using the current SDK/RPC
   status API;
6. waits for `FINALIZED` for every state-changing step;
7. checks `txExecutionResultName` for successful execution before treating
   state as changed; and
8. reads the expected contract state back and blocks progress on any digest,
   verdict, state, or authorization mismatch.

Timeout, refresh, RPC polling failure, or wallet UI failure never authorizes a
second submission. If a submission returns no hash, the UI records an
unknown-submission state and requires manual, hash-based recovery rather than
rebroadcasting.
