# DealMesh candidate gate

Access date: 2026-08-27 (Africa/Lagos).

## Decision

The complete DealMesh V1 scope passes the Project candidate gate. It is a
pre-execution bilateral agreement authorization workflow containing an
application-specific Intelligent Contract, not a standalone reusable
Intelligent Contract or generic compliance classifier. The gate does not claim
participant requirements are true in the outside world or that an action is
safe.

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Track fit | PASS | DealMesh is a Project: its application-specific Intelligent Contract owns identity, commitments, canonical integrity, typed admissibility, semantic consensus, lifecycle, finality callbacks, and exact authorization, while the complete frontend provides the user-facing workflow. |
| B. Real trust problem | PASS | Two parties need a neutral interpretation; neither offer submitter, backend, frontend, nor one provider can unilaterally authorize. |
| C. GenLayer necessity | PASS | Deterministic code cannot interpret bounded natural language; validators can independently agree on the exact residual question. |
| D. Evidence | PASS for V1 | Evidence is authenticated on-chain participant commitments and the exact offer. No external fact or URL is accepted. |
| E. Bounded consensus | PASS | One fixed prompt envelope and one strict enum. Malformed output and disagreement are technical failures. |
| F. Consequence | PASS | Only the exact finalized MATCH path can produce exact non-submitter BOUND authorization. No payment or arbitrary action exists. |
| G. Differentiation | PASS | DealMesh forms a single bilateral agreement before execution; it does not rank bids, verify delivery, attribute fault, certify software, or settle an SLA. |
| H. Continued use | PASS | The same reusable commitment/offer/authorization flow supports independent human and agent agreements. |
| I. Proofability | PASS | The deterministic/mocked contract and frontend suites, linter validation, two hosted multi-validator DealMesh lifecycle implementations, and a finalized-callback authority probe exist. Local Studio remains blocked by an empty validator set. |
| J. Honesty | PASS | Bradbury deployment is finalized and successfully executed, but the live lifecycle has not started: no create hash, MATCH, callback, BOUND, or is_bound evidence is claimed. Capacity and packaging blockers are reported separately from semantic or contract behavior. |

## Current gate status

| Gate | Status | Basis |
| --- | --- | --- |
| STAGE_0_GATE | PASS | Scope and trust boundary are documented. |
| IMPLEMENTATION_GATE | PASS | Contract and complete user-facing workflow are implemented. |
| DETERMINISTIC_CI_GATE | PASS | Direct/mocked contract tests, frontend tests/build, and contract validation are green. |
| STUDIO_INTEGRATION_GATE | PASS — hosted multi-validator Studio | Existing hosted implementations exercised multi-validator semantics and finalized callbacks; preserved evidence is insufficient to independently prove BOUND. |
| LOCAL_STUDIO_HEALTH | BLOCKED — zero configured local validators | The current local `sim_getAllValidators` returns zero validators; this is a separate development-environment status and does not invalidate hosted proof. |
| RELEASE_GATE | BLOCKED - Bradbury capacity and unfinished proof/release packaging | Deployment is finalized and successfully executed; the live lifecycle has not started and no final authorization evidence exists. |

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

If V1 later needs an external-world fact, the project must first define source
authority, key binding, freshness, canonical bytes, replay protection, digest,
and reproducible validator verification. Until then the evidence boundary is
participant-authenticated on-chain data only.
