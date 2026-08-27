# DealMesh candidate gate

Access date: 2026-08-27 (Africa/Lagos).

## Decision

The complete DealMesh V1 scope passes the Project candidate gate. It is a
pre-execution bilateral agreement authorization primitive, not a generic
compliance classifier. The gate does not claim participant requirements are
true in the outside world or that an action is safe.

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Track fit | PASS | The Intelligent Contract owns identity, commitments, canonical integrity, typed admissibility, semantic consensus, lifecycle, finality callbacks, and exact authorization. |
| B. Real trust problem | PASS | Two parties need a neutral interpretation; neither offer submitter, backend, frontend, nor one provider can unilaterally authorize. |
| C. GenLayer necessity | PASS | Deterministic code cannot interpret bounded natural language; validators can independently agree on the exact residual question. |
| D. Evidence | PASS for V1 | Evidence is authenticated on-chain participant commitments and the exact offer. No external fact or URL is accepted. |
| E. Bounded consensus | PASS | One fixed prompt envelope and one strict enum. Malformed output and disagreement are technical failures. |
| F. Consequence | PASS | Only the exact finalized MATCH path can produce exact non-submitter BOUND authorization. No payment or arbitrary action exists. |
| G. Differentiation | PASS | DealMesh forms a single bilateral agreement before execution; it does not rank bids, verify delivery, attribute fault, certify software, or settle an SLA. |
| H. Continued use | PASS | The same reusable commitment/offer/authorization flow supports independent human and agent agreements. |
| I. Proofability | PASS for current scope | 38 deterministic/mocked contract tests, 9 frontend lifecycle tests, linter validation, two hosted multi-validator DealMesh lifecycle tests, and a successful finalized-callback authority probe exist. |
| J. Honesty | PASS | No Bradbury deployment or public production authorization is claimed. Hosted proof uses ephemeral Studio state and is reported separately from a production deployment. |

## Finality gate

Official GenLayer Messages guidance documents asynchronous internal messages
with on="finalized". The hosted Studio probe proved in the selected runtime
that the child is absent at ACCEPTED, appears only after parent FINALIZED, and
can write through a same-contract callback. DealMesh uses this path for both
assessment finalization and binding finalization. A direct bind_match caller
can create only BINDING_PENDING_FINALITY; it cannot write BOUND.

The frontend/downstream consumer still reads the finalized state variant and
waits for the callback child to finalize successfully. This is necessary
because a non-final read can observe a callback transaction before its own
finality.

## Safe evidence boundary

If V1 later needs an external-world fact, the project must first define source
authority, key binding, freshness, canonical bytes, replay protection, digest,
and reproducible validator verification. Until then the evidence boundary is
participant-authenticated on-chain data only.
