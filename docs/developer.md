# DealMesh developer instructions

DealMesh has one authoritative implementation boundary: the Intelligent
Contract. The frontend is a wallet-backed transaction and read-back client;
it must not calculate a verdict, decide authorization, or retry an uncertain
write.

## Local checks

Use the pinned production dependency for contract validation:

    $env:GENVM_VERSION='v0.3.0-rc7'
    genvm-lint check contracts/deal_mesh.py

Direct tests use the installed Direct Mode compatibility runner
`v0.2.12`. They cover deterministic logic and mocked semantic calls only; a
passing Direct test is not validator-consensus evidence.

    python -m pytest tests/direct tests/mocked -q

For the frontend:

    cd frontend
    npm ci
    npm test
    npm run build

The hosted Studio integration test is opt-in and requires multiple configured
validators. It is the consensus/finality evidence for the production runner:

    $env:DEALMESH_STUDIO='1'
    gltest tests/integration -m studio -q --network studionet --rpc-url https://studio.genlayer.com/api

Do not run Bradbury writes from tests or development scripts.

## Contract rules

- Keep all party identity checks on the native `gl.message.sender_address`.
- Preserve the versioned canonical encodings and lowercase SHA-256 digests.
- Treat requirements, terms, and model output as untrusted input.
- Keep deterministic, model, consensus, execution, wallet/RPC, and read-back
  failures separate. Never convert a technical failure into a verdict.
- The only assessment question is whether the exact stored offer satisfies
  both immutable requirement sets. A model cannot edit or select terms.
- Preserve one offer and one assessment per deal.
- Preserve the `on="finalized"` internal callbacks. Direct wallet calls to
  `finalize_assessment` or `finalize_binding` must fail.
- A downstream consumer must query `is_bound(deal_id, offer_digest)` against
  the finalized state variant and reject every other digest.

## Frontend write protocol

Every user write follows this sequence:

    PRECONDITION READ
    BROADCAST ONCE
    PERSIST HASH IMMEDIATELY
    RECONCILE THE SAME HASH TO FINALIZED
    CHECK FINISHED_WITH_RETURN
    READ THE FINALIZED STATE BACK
    ENABLE THE NEXT ACTION

The local transaction store is durable browser storage. On refresh, recovery
polls the stored parent hash and, after parent finality, discovers and stores
the exact contract-owned callback hash. It never reconstructs calldata or
rebroadcasts after a timeout, refresh, missing hash, or poller error. An
unknown submission is explicitly manual-recovery state.

Never place private keys, seed phrases, backend adjudication, or external
evidence URLs in this repository. The browser wallet signs transactions; the
frontend only formats and displays live contract state.
