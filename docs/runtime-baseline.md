# DealMesh runtime baseline

Access date: 2026-08-27 (Africa/Lagos).

## Verified production baseline

- GenVM artifact bundle: v0.3.0-rc7, present in the current GenVM linter cache.
- Contract header pin: py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6.
- Verification: GENVM_VERSION=v0.3.0-rc7 genvm-lint check contracts/deal_mesh.py passed lint and semantic validation.
- The linter reports a newer 1zr runner, but its bootloader-era standard library is not loadable by the installed linter 0.11.0 or genlayer-test Direct Mode 0.29.2. The 1jb runner is the current documented and compatible runner: it validates locally and executed in hosted Studio.
- Python: 3.14.3. Node.js/npm are used for the frontend; the official setup guidance requires Node.js 18+.
- GenLayer CLI: 0.39.1.
- genlayer-test: 0.29.2; genvm-linter: 0.11.0; genlayer-py: 0.16.3.
- GenLayerJS: 1.1.8, pinned in frontend/package.json and package-lock.json.
- Frontend build tools: Vite 8.2.2, React 19.2.8, TypeScript 7.0.2, Vitest 4.1.11.

The Direct Mode fixture intentionally selects cached v0.2.12 because the installed
genlayer-test harness cannot initialize the v0.3 bootloader runner. Direct tests
are deterministic unit/mocked-consensus coverage, not consensus proof. The
hosted Studio test uses multiple validators and the production dependency header.

## Finality authority

Official Messages guidance documents asynchronous internal IC messages and says
emit(on="finalized") creates the child transaction only after the parent has
fully finalized. The narrow hosted test
tests/integration/test_finality_authority.py ran successfully on 2026-08-27:
at parent ACCEPTED, triggered transaction IDs were empty and the receiver had
no marker; after parent FINALIZED, one child appeared, finalized successfully,
and wrote the marker. The same test also proved a same-contract callback.

The complete DealMesh lifecycle passed in two independent hosted Studio test
modules on 2026-08-27. Both used two funded accounts, finalized writes, real
semantic validator execution, and finalized callback/read-back checks. A
separate local Studio preflight returned zero validators from
`sim_getAllValidators` and reported a dead validator process; that is a local
infrastructure precondition failure, not a semantic or contract verdict.

DealMesh uses that mechanism twice:

1. assess_offer stores a provisional assessment and schedules
   finalize_assessment with on="finalized".
2. bind_match stores BINDING_PENDING_FINALITY and schedules finalize_binding
   with on="finalized".

Only the callback methods can move those pending states forward, and they
require native sender authentication from the contract address. The frontend
waits for the parent and callback hashes to finalize with successful execution
and reads the finalized state variant. It never passes or trusts a finality
boolean, ACCEPTED status, or cached RPC result.

## Network details

The current official network page lists Bradbury as:

- GenLayer RPC: https://rpc-bradbury.genlayer.com
- underlying chain RPC: https://rpc.testnet-chain.genlayer.com
- chain ID: 4221
- currency: GEN
- explorer: https://explorer-bradbury.genlayer.com
- chain explorer: https://explorer.testnet-chain.genlayer.com

The CLI confirmed the selected Bradbury endpoint and chain ID. DealMesh has
not deployed or sent a Bradbury write.

## Testing/tooling commands

Contract validation:

    $env:GENVM_VERSION='v0.3.0-rc7'
    genvm-lint check contracts/deal_mesh.py

Deterministic and mocked coverage:

    python -m pytest tests/direct tests/mocked -q

Frontend:

    cd frontend
    npm ci
    npm test
    npm run build

Local Studio finality and full project integration (when enabled):

    $env:DEALMESH_STUDIO='1'
    python -m pytest tests/integration -m studio -q

No Bradbury deployment or write is part of this baseline. A future Bradbury
preflight must be green before any write.
