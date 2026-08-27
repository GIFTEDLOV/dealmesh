# DealMesh security model

## Security invariants

- The native transaction sender, never an argument or display name, determines
  identity.
- A and B commitments, nominated party, unit, and action digest are write-once.
- All text, terms, numeric bounds, hashes, and state transitions are checked
  deterministically before semantic execution.
- Only the strict semantic enum can become a business result.
- `INCONCLUSIVE` is substantive semantic ambiguity only; technical failure has
  no verdict fallback.
- Independent validator agreement is required for the stored assessment.
- Only finalized internal callbacks advance pending states.
- Only the non-submitting party can request exact MATCH binding.
- The exact `(deal_id, offer_digest, assessment_id, agreement_digest)` binding
  is the only consumer authorization key.
- The frontend never treats an accepted or cached write as usable: it requires
  finality, successful execution, and exact read-back, and never rebroadcasts
  after submission uncertainty.

## PREVENT / DETECT / FAIL-CLOSED matrix

| Threat | Prevent | Detect | Fail-closed consequence |
| --- | --- | --- | --- |
| forged party identity | use native sender and immutable party addresses | sender comparisons in every write | revert; no state change |
| commitment mutation | write-once state and no update method | read-back digests and state | reject changed/mismatched record |
| offer tampering or ambiguous serialization | canonical UTF-8, sorted terms, fixed preimages, exact hashes | recompute/read back digests | reject offer; no assessment |
| out-of-range price/deadline | deterministic finite bounds and interval intersection | contract checks before nondeterminism | revert; no model call |
| wrong action or offer identity | exact action and `(deal_id, offer_digest)` checks | consumer compares all bindings | reject binding/consumer action |
| prompt injection in participant text | delimit text as data; fixed prompt; no URLs or commands | strict enum parser; adversarial tests | model failure or non-authorizing result |
| model invents terms or numbers | no output channel for them; parser keeps only enum | exact key-set/type checks | technical/model failure |
| malformed or duplicate-key output | strict JSON parser with duplicate-key rejection | direct and mocked malformed-output tests | revert; no semantic result |
| validator disagreement | independent validator rerun and exact enum comparison | consensus receipt/status | no assessment authorization; technical failure |
| accepted but not finalized | pending states and internal `on="finalized"` callbacks | finalized receipt and final read-back | consumer rejects pending state |
| attacker calls finalizer | finalizer requires contract sender and all exact fields | callback sender and binding checks | revert; pending state remains |
| wrong party binds | require exact A/B and non-submitter sender | stored submitter comparison | revert; no binding |
| timeout, refresh, or duplicate write | persist known hash immediately; recovery is hash-only | lifecycle store and tests | unknown submission remains manual; no rebroadcast |
| stale or inconsistent RPC read | finalized read variant and exact object comparison | read-back mismatch error | UI blocks progress |
| unavailable external evidence | V1 accepts no external evidence | schema/API boundary review | no semantic call; no authorization |
| replay of old deal/offer state | nonce-bound IDs and exact current-state checks | state/digest comparison | reject superseded or wrong pair |
| frontend/backend override | contract owns all authorization conditions | consumer reads contract state synchronously | cached/off-chain assertion ignored |
| secret leakage | wallet/provider signs externally; no keys in code | repository and log review | deployment stopped; key never accepted |
| unbounded resource use | bounded text, terms, one semantic call, no web fetch | lint and direct bounds tests | revert before semantic execution |

## Failure namespaces

Business errors such as `INVALID_STATE`, `OFFER_NOT_ALLOWED`, and
`MATCH_NOT_FINALIZED` are distinct from integrity errors such as
`CANONICALIZATION_FAILED`, `DIGEST_MISMATCH`, and
`ACTION_DIGEST_MISMATCH`. Model/parser failures, consensus/finality failures,
execution failures, wallet/RPC failures, and read-back mismatches are also
separate categories. None is encoded as `INCONCLUSIVE` by fallback.

## Model policy

Requirement text is untrusted data and can contain strings such as “ignore
previous instructions.” The prompt explicitly delimits it, but prompt hygiene
is defense in depth, not a trust boundary. The parser requires one JSON object,
exactly one `verdict` key, and one exact enum value. Reasoning, confidence,
numbers, alternate terms, and markdown are not accepted or stored.

## Consumer policy

A consumer must synchronously re-read the finalized DealMesh state and require
the exact assessment, deal, offer, action, party, and agreement identities it
committed to. It must reject empty, malformed, pending, superseded, non-final,
`NO_MATCH`, `INCONCLUSIVE`, or technical records. It must never trust a
frontend cache or backend-computed authorization.
