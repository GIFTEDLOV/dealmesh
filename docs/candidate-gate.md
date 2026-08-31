# DealMesh candidate gate

Access date: 2026-08-27 (Africa/Lagos).

## Decision

The complete DealMesh V1 scope passes the Intelligent Contract candidate gate.
It is a reusable pre-execution bilateral agreement and exact-authorization
primitive, not a generic compliance classifier. The included frontend is a
reference integration. The gate does not claim participant requirements are
true in the outside world or that an action is safe.

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Track fit | PASS | DealMesh is an Intelligent Contract: it exposes reusable identity, commitment, canonical-integrity, typed-admissibility, semantic-consensus, finalized-binding, and exact-authorization functionality. The frontend is an optional reference client. |
| B. Real trust problem | PASS | Two parties need a neutral interpretation; neither offer submitter, backend, frontend, nor one provider can unilaterally authorize. |
| C. GenLayer necessity | PASS | Deterministic code cannot interpret bounded natural language; validators can independently agree on the exact residual question. |
| D. Evidence | PASS for V1 | Evidence is authenticated on-chain participant commitments and the exact offer. No external fact or URL is accepted. |
| E. Bounded consensus | PASS | One fixed prompt envelope and one strict enum. Malformed output and disagreement are technical failures. |
| F. Consequence | PASS | Only the exact finalized MATCH path can produce exact non-submitter BOUND authorization. No payment or arbitrary action exists. |
| G. Differentiation | PASS | DealMesh forms a single bilateral agreement before execution; it does not rank bids, verify delivery, attribute fault, certify software, or settle an SLA. |
| H. Continued use | PASS | The same reusable commitment/offer/authorization flow supports independent human and agent agreements. |
| I. Proofability | PASS | The deterministic/mocked contract and frontend suites, linter validation, two hosted multi-validator DealMesh lifecycle implementations, and a finalized-callback authority probe exist. Local Studio remains blocked by an empty validator set. |
| J. Honesty | PASS | Bradbury deployment and the single locked lifecycle are independently finalized. Attempt 4 honestly records the integer-encoded digest failure; the corrected lifecycle records `MATCH`, finalized assessment and binding callbacks, `BOUND`, exact `is_bound=true`, and wrong-digest `false`. The optional reference frontend URL and HTTP 200 are recorded; interactive browser smoke was unavailable in the release environment. |

## Current gate status

| Gate | Status | Basis |
| --- | --- | --- |
| STAGE_0_GATE | PASS | Scope and trust boundary are documented. |
| IMPLEMENTATION_GATE | PASS | Contract, exact consumer interface, integration documentation, and optional reference client are implemented. |
| DETERMINISTIC_CI_GATE | PASS | Direct/mocked contract tests, frontend tests/build, and contract validation are green. |
| STUDIO_INTEGRATION_GATE | PASS — hosted multi-validator Studio | Existing hosted implementations exercised multi-validator semantics and finalized callbacks; preserved evidence is insufficient to independently prove BOUND. |
| LOCAL_STUDIO_HEALTH | BLOCKED — zero configured local validators | The current local `sim_getAllValidators` returns zero validators; this is a separate development-environment status and does not invalidate hosted proof. |
| RELEASE_GATE | PASS | Bradbury deployment and the complete locked lifecycle are finalized successfully, including `MATCH`, both callbacks, exact `BOUND`, and downstream authorization rejection for the wrong digest. |

## Finality gate

Official GenLayer Messages guidance documents asynchronous internal messages
with on="finalized". The narrow callback probe proved in the selected runtime
that the child is absent at ACCEPTED, appears only after parent FINALIZED, and
can write through a same-contract callback. The full DealMesh Studio lifecycle
was implemented against the hosted multi-validator endpoint, including
semantic execution and finalized callback assertions. Preserved repository
evidence does not include sufficient immutable receipts or hashes to
independently prove that a hosted run reached BOUND. Local Studio remains
blocked before semantic execution because its validator set is empty. DealMesh
uses this callback path for both assessment finalization and binding
finalization. A direct bind_match caller can create only
BINDING_PENDING_FINALITY; it cannot write BOUND.

The frontend/downstream consumer still reads the finalized state variant and
waits for the callback child to finalize successfully. This is necessary
because a non-final read can observe a callback transaction before its own
finality.

## Safe evidence boundary

If V1 later needs an external-world fact, an integrating project must first define source
authority, key binding, freshness, canonical bytes, replay protection, digest,
and reproducible validator verification. Until then the evidence boundary is
participant-authenticated on-chain data only.
