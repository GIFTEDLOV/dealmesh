# DealMesh architecture

This is the implemented V1 boundary. The contract is the sole authority for
party identity, commitments, admissibility, semantic verdict storage, and
exact binding.

## Authoritative semantic question

For the exact stored commitments and exact submitted offer:

> Does this exact offer satisfy both Party A's and Party B's immutable
> bounded natural-language requirements?

The deterministic layer checks sender identity, state, typed price/deadline
bounds, the shared price unit, the action digest, canonical text, ordered
terms, and all hashes before the semantic call. The model returns exactly one
of:

```json
{"verdict":"MATCH"}
{"verdict":"NO_MATCH"}
{"verdict":"INCONCLUSIVE"}
```

`INCONCLUSIVE` means the admitted bounded text is substantively insufficient
or ambiguous. It is not a model/parser/network/consensus/execution fallback.
Those failures revert or remain outside an authorization state.

## State machine

```text
CREATED_A_COMMITTED
        |
        v
ACTIVE_B_COMMITTED
        |
        v
OFFER_SUBMITTED
        |
        +--> ASSESSED_MATCH_PENDING_FINALITY
        |          |
        |          v  internal on="finalized" callback
        |      ASSESSED_MATCH_FINALIZED
        |          |
        |          v  other party requests exact pair
        |      BINDING_PENDING_FINALITY
        |          |
        |          v  internal on="finalized" callback
        |         BOUND
        |
        +--> ASSESSED_NO_MATCH_PENDING_FINALITY --> ASSESSED_NO_MATCH
        |
        +--> ASSESSED_INCONCLUSIVE_PENDING_FINALITY --> ASSESSED_INCONCLUSIVE
```

The pending states are deliberate. The parent write records the semantic
assessment, but the internal callback is the only permitted path to its final
state. Wallets cannot call either finalizer because the contract checks the
authenticated sender against its own address and verifies every binding field.

There is one offer and one assessment per deal. This prevents silent
replacement or negotiation after a semantic result.

## Sender and immutability rules

- `create_deal` uses the native sender as Party A and rejects zero or duplicate
  parties.
- Only the nominated Party B can accept.
- Only A or B can submit or assess the stored offer.
- Commitments, nominated party, price unit, and action digest are write-once.
- Only the non-submitting party can request `bind_match`.
- Finalizers require the contract sender and exact deal, assessment, offer,
  request, and binder fields.

No method accepts a user-supplied sender, finalized flag, verdict, action body,
or arbitrary callback target.

## Typed bounds and canonical encoding

The current limits are:

| Field | Bound |
| --- | --- |
| price unit | 1-16 ASCII bytes, `[A-Z0-9._-]+` |
| prices | unsigned `0..10^18-1` |
| deadlines | Unix seconds `1..4,102,444,800` |
| requirement text | NFC UTF-8, 1-4096 bytes; no NUL, edge whitespace, or URL-shaped references |
| terms | 1-8 ordered `{key,value}` entries; key 1-32 lowercase ASCII bytes; value 1-512 canonical bytes |
| hash fields | lowercase `0x` followed by 64 hexadecimal characters |

Party B's interval must intersect A's interval. The offer must be inside that
intersection and carry exactly A's action digest. The contract performs all
checks; client preflight is only a user-interface aid.

Digests use SHA-256 over versioned length-prefixed preimages. Text is encoded
as `S<utf8-byte-length>:<text>`, unsigned values as `U<decimal>;`, and hashes
as `H<hash>;`. `deal_id`, per-party commitment digests, `offer_digest`,
assessment IDs, binding request IDs, and `agreement_digest` all bind exact
fields and a nonce where applicable.

## Semantic execution

The prompt is fixed and bounded. Participant text is enclosed as data and can
contain adversarial instructions; it is never an instruction channel. Typed
values have already passed deterministic checks. The semantic call has no web
access, private keys, action body, external URL, or output channel for new
terms or numbers.

The leader result is parsed strictly. The validator independently executes the
same prompt and accepts only if its parsed enum equals the leader's enum. A
malformed result or failed consensus is technical failure and does not write a
business verdict.

## Contract API and consumer boundary

The public views return canonical JSON with the stored digests, state, exact
offer identity, assessment identity, and binding identity. `is_bound` returns
true only for the exact stored `(deal_id, offer_digest)` pair in `BOUND`.

A downstream consumer should synchronously re-read the finalized DealMesh
state and require:

- the expected assessment ID and deal ID;
- the expected integration/deal identity;
- the exact offer digest and action digest;
- `ASSESSED_MATCH_FINALIZED` before requesting binding, then `BOUND` for a
  completed authorization; and
- the expected agreement digest and bound party.

Unknown, superseded, non-final, mismatched, or malformed records are rejected.
DealMesh itself does not perform money movement or downstream execution.

## Frontend lifecycle

The GenLayerJS frontend creates separate read and wallet-backed write clients.
For each write it calls `writeContract` once and persists the returned hash
before polling. Recovery enumerates persisted hashes and never reconstructs or
rebroadcasts calldata. It waits for `TransactionStatus.FINALIZED`, requires
`ExecutionResult.FINISHED_WITH_RETURN`, and then compares the exact read-back
object. Triggered finality callbacks are discovered from the finalized parent,
finalized independently, and read back before the UI treats the state as
usable.

`ACCEPTED` is a progress status, not an authorization threshold.
