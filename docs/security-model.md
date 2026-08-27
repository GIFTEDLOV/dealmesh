# DealMesh security model

## Security invariants

The future implementation must preserve these invariants:

- The native transaction sender, not a method argument, determines identity.
- Party commitments are write-once and immutable.
- Only the nominated Party B can accept participation.
- Only A or B can submit the one offer; no third party can create an
  assessment.
- Every typed value is bounded and checked before any model call.
- The offer action digest must equal Party A's immutable digest.
- The offer digest is computed from one canonical encoding and is stored with
  the exact offer and verdict.
- Only the exact parsed enum is a business result.
- Malformed model output never defaults to a business verdict.
- Consensus failure never writes `BOUND`.
- Only `MATCH` can reach binding, and only for the exact deal and offer
  digest.
- The non-submitting party is the only permitted binder.
- A frontend timeout, refresh, or poller failure never causes rebroadcast.
- The downstream view rejects every unbound or mismatched pair.

## Threats and controls

| Threat | Control |
| --- | --- |
| Forged party identity | Use the native sender address; compare it to immutable party addresses; never trust a sender argument or display name. |
| Party changes requirements after seeing an offer | Store A and B commitments once; no update or replacement method. |
| Offer tampering or ambiguous serialization | Canonical UTF-8 rules, ordered term keys, fixed field order, versioned preimages, strict lowercase hashes, and an exact `offer_digest`. |
| Out-of-range price/deadline | Deterministic finite ranges and bilateral interval checks before non-deterministic execution. |
| Wrong action selected | Require offer `action_digest == stored action_digest`; no action body or arbitrary callback is accepted. |
| Prompt injection in requirements or terms | Treat all authored text as untrusted evidence, delimit it as data, use a fixed prompt, disallow URLs, and accept only the strict enum. Prompt hygiene is defense in depth, not a claim that an LLM is trusted. |
| Model invents terms or numbers | The prompt asks only for a verdict; typed values are prevalidated and the parser discards everything except the enum. |
| Malformed, extra-key, or duplicate-key output | Strict single-object parser with exact key set and exact enum; technical/model error with no fallback. |
| Leader-only validation | Validator independently reruns the same bounded task and compares its parsed verdict to the leader's result. |
| Validator disagreement or timeout | Classify as consensus failure/undetermined; never map it to `NO_MATCH` or `MATCH`. |
| Accepted but not finalized assessment | Frontend waits for the exact assessment transaction to be `FINALIZED`, checks successful execution, and reads back the expected state before enabling bind. A client boolean is never proof. |
| Binding a different offer | `bind_match` takes the expected `deal_id` and `offer_digest`; the contract compares both to stored state and the read-only consumer also keys by both. |
| Wrong party binds | Require the authenticated sender to be the other party, not the offer submitter. |
| Transaction timeout or refresh duplicates a write | Persist the returned hash immediately and recover/poll by hash. Never retry submission automatically after uncertainty. |
| RPC gives stale or inconsistent state | Read back after finality, compare state/digests/verdict, and block on mismatch. |
| Secrets leak through app or logs | Never request, print, store, or commit private keys or seed phrases; wallets sign externally. |
| Unbounded resource use | Bound all text and collections, use one semantic call per offer, and avoid web access and nested non-determinism. |

## Error taxonomy

The contract/app keeps these namespaces distinct. A user-facing message may
be friendlier, but the machine-readable class must not be collapsed.

### Deterministic business errors (`DM-B`)

`DEAL_NOT_FOUND`, `INVALID_STATE`, `PARTY_B_NOT_ACCEPTED`,
`TYPED_INTERVAL_EMPTY`, `OFFER_NOT_ALLOWED`, `OFFER_ALREADY_SUBMITTED`.

These mean the request is incompatible with the current contract state or
business bounds.

### Integrity and schema errors (`DM-I`)

`INVALID_ADDRESS`, `INVALID_HASH_FORMAT`, `CANONICALIZATION_FAILED`,
`DIGEST_MISMATCH`, `INVALID_TEXT`, `INVALID_TERM_COLLECTION`,
`ACTION_DIGEST_MISMATCH`, `NONCE_REPLAY`.

These mean the supplied bytes, identity, or schema cannot be bound safely.

### Semantic/model errors (`DM-M`)

`MODEL_CALL_FAILED`, `MODEL_OUTPUT_NOT_JSON`,
`MODEL_OUTPUT_NOT_SINGLE_OBJECT`, `MODEL_OUTPUT_DUPLICATE_KEY`,
`MODEL_OUTPUT_WRONG_KEYS`, `MODEL_OUTPUT_UNKNOWN_VERDICT`,
`MODEL_OUTPUT_WRONG_TYPE`.

These are technical/model failures, never `NO_MATCH` and never
`INCONCLUSIVE` by fallback.

### Consensus errors (`DM-C`)

`CONSENSUS_UNDETERMINED`, `VALIDATOR_DISAGREEMENT`, `VALIDATOR_TIMEOUT`,
`APPEAL_PENDING`, `FINALITY_NOT_REACHED`.

These describe network consensus/finality state and do not authorize a
business result.

### Execution errors (`DM-X`)

`CONTRACT_REVERT`, `VM_ERROR`, `RESOURCE_LIMIT`, `FINISHED_WITH_ERROR`,
`EXECUTION_RESULT_UNAVAILABLE`.

These are transaction execution outcomes. State must not be treated as
updated unless the final receipt reports successful execution.

### Wallet/RPC errors (`DM-W`)

`USER_REJECTED`, `CHAIN_MISMATCH`, `INSUFFICIENT_FUNDS`, `RPC_UNAVAILABLE`,
`TX_HASH_NOT_RETURNED`, `TX_SUBMISSION_UNKNOWN`, `POLL_TIMEOUT`.

The app may retry a read or poll by an already-known hash. It must not
rebroadcast a write from any of these states.

### State mismatch errors (`DM-S`)

`ASSESSMENT_STATE_MISMATCH`, `OFFER_DIGEST_MISMATCH`,
`VERDICT_READBACK_MISMATCH`, `BOUND_AUTHORIZATION_MISMATCH`.

These are fail-closed verification errors after finality. The app stops and
requires investigation; it does not attempt a replacement transaction.

## Prompt injection and model-output policy

Party-authored text can contain strings such as “ignore previous
instructions.” The deterministic contract treats them as bytes in evidence.
The prompt marks them as data and the model has no output channel for terms,
numbers, URLs, or commands. The strict parser still treats the model as
untrusted, so prompt instructions are not a security boundary by themselves.

The only accepted state input from the model is the exact three-value enum
after independent validator agreement. Any reason, confidence, extra key,
markdown wrapper, casing variation, trailing prose, or second JSON value is a
technical/model failure.

## Finality and rebroadcast safety

`ACCEPTED` is not the binding threshold. The app waits for `FINALIZED`, then
checks the execution result and reads state. It persists transaction records
such as `submitted`, `hash`, `last_status`, `execution_result`, and expected
digest before polling. Recovery is hash-based and idempotent. If the hash is
unknown, the app does not guess whether a write landed and does not submit a
new one automatically.
