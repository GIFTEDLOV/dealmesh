# DealMesh candidate gate

Access date for this gate: 2026-08-27 (Africa/Lagos).

## Decision

The candidate passes the Stage 0 design gate. The pass is conditional on
Stage 1 proving the specified boundary with tests and a real GenLayer
execution. It is not a claim that an implementation, deployment, or live
consensus result exists.

| Gate | Assessment | Basis and falsifier |
| --- | --- | --- |
| A. Track fit | PASS | This is a complete planned user-facing Project application with a bilateral IC workflow, not a standalone IC idea. It would fail if reduced to a storage adapter or cosmetic UI. |
| B. Real trust problem | PASS | Two named parties need a neutral interpretation of natural-language requirements; a centralized backend or one AI provider must not unilaterally settle the result. |
| C. GenLayer necessity | PASS | Typed checks are deterministic, but the residual natural-language compatibility question needs semantic judgment and validator consensus. If all requirements become machine-checkable, GenLayer is unnecessary for that portion. |
| D. Evidence | PASS with limitation | Evidence is exact participant-authored, wallet-authenticated, on-chain commitments and offer data. No external real-world fact is adjudicated. This is integrity evidence, not proof that the requirements are objectively fair or true. |
| E. Bounded consensus | PASS | The semantic question has one bounded input envelope and exactly three verdicts. A custom leader/validator pair independently reruns the task and compares the parsed enum. |
| F. State consequence | PASS | Only a finalized successful assessment with `MATCH`, followed by the non-submitter's exact acceptance, creates permanent `BOUND` authorization for one deal and offer digest. |
| G. Differentiation | PASS | It forms one pre-execution agreement between identified parties; it does not rank bids, resolve delivery disputes, attribute fault, certify software, adjudicate external evidence, or settle money. |
| H. Continued use | PASS | The same bounded workflow can be reused for many bilateral agent, human, or agent-human agreements without becoming a marketplace or a generic chatbot. |
| I. Proofability within 24 hours | PASS with delivery risk | The narrow flow is testable with direct-mode storage/admissibility tests, mocked semantic responses, and a small Studio/Bradbury proof. The proof is planned, not available in Stage 0; network/runtime availability could still block live evidence. |
| J. Factual honesty | PASS | This repository labels all future behavior as planned, records the current official baseline, and makes no claim of deployment, frontend completion, finality proof, or green contract tests. |

## What this gate permits

Stage 1 may implement the contract and frontend only if it preserves:

- one exact semantic question;
- no model-authored terms or numeric decisions;
- immutable party commitments;
- deterministic typed admissibility before semantic execution;
- strict parser failure for malformed output;
- no external URLs or evidence in V1;
- finality-aware application flow with no rebroadcast after uncertainty; and
- exact downstream binding by both `deal_id` and `offer_digest`.

## Smallest safe redesign if a gate fails

If Stage 1 cannot demonstrate finality-aware binding with the supported
GenLayer APIs, remove binding from the release rather than treating
`ACCEPTED` as final or trusting a client boolean. If semantic consensus is too
unstable, retain only a recorded `INCONCLUSIVE`/technical outcome and do not
add retries that silently create a different offer. If the natural-language
requirements become unbounded or external, narrow the schema instead of
adding a backend adjudicator.
