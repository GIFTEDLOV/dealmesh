# GenLayer runtime and tooling baseline

Access date: 2026-08-27 (Africa/Lagos).

This is a current documentation baseline, not a deployment record. No
DealMesh contract exists yet, so no contract runtime pin has been selected,
linted, or deployed. Pins from unrelated projects are intentionally not
reused.

## Current compatible baseline

- Intelligent Contracts are Python programs executed by GenVM and extend
  `gl.Contract`; public views and writes use the GenLayer decorators.
- The official setup guidance currently lists Python 3.12+ for contracts,
  linting, and testing; Node.js 18+ for the GenLayer CLI and frontend; and
  Docker 26+ only when running local Studio.
- The current fast runner path is `genlayer-test` Direct Mode through
  `pytest`, with no server or Docker. It is the appropriate baseline for the
  first DealMesh tests.
- `genvm-lint check` is the required future contract static/semantic check;
  it also validates GenVM SDK compatibility, storage types, decorators, and
  non-deterministic placement.
- `gltest` is reserved for future Studio/integration tests, where real
  multi-validator or network behavior is needed. `glsim` is an optional fast
  JSON-RPC simulator, but its native runner can differ from full GenVM.
- The future frontend uses `genlayer-js` with a read client and a separate
  wallet-backed write client. It must wait for `FINALIZED`, inspect the
  execution result, and read state back before treating a write as complete.

## Runner and dependency declaration

The current official first-contract guidance requires a first-line GenVM
dependency comment of this form:

```python
# { "Depends": "py-genlayer:<verified-runtime-identifier>" }
```

As observed in the current official example on the access date, the example
identifier is:

```text
py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6
```

This example is recorded for provenance only. It is not adopted as the
DealMesh pin because no contract exists to validate against it. Stage 1 must
resolve the compatible runtime with the current linter/SDK tooling, run
direct tests in that environment, and commit the exact verified dependency
header in the contract. The runner baseline is therefore:

`GenVM + current py-genlayer dependency header → genvm-lint → pytest /
genlayer-test Direct Mode → gltest Studio Mode when integration exists`.

No runtime package version, frontend package version, or lockfile is claimed
in Stage 0.

## Bradbury details

The current official network documentation lists Testnet Bradbury as the
production-like testnet for real AI/LLM workloads:

- GenLayer RPC: `https://rpc-bradbury.genlayer.com`
- underlying chain RPC: `https://rpc.testnet-chain.genlayer.com`
- chain ID: `4221`
- currency: `GEN`
- explorer: `https://explorer-bradbury.genlayer.com`
- chain explorer: `https://explorer.testnet-chain.genlayer.com`

DealMesh did not deploy to Bradbury and sent no Bradbury write transaction in
Stage 0. Bradbury is a documented target for a future proof, not evidence
that DealMesh is live.

## Transaction and finality baseline

The documented consensus lifecycle includes `PENDING`, `PROPOSING`,
`COMMITTING`, `REVEALING`, `ACCEPTED`, `FINALIZED`, `UNDETERMINED`, and
`CANCELED`, with additional appeal/timeout states exposed by the status API.
`FINALIZED` is the irreversible, no-longer-appealable threshold. The future
app will poll the exact transaction hash, wait for `FINALIZED`, inspect the
execution result, and read contract state back. It will never use `ACCEPTED`
as the binding threshold.

## Official sources checked

All links below were checked on 2026-08-27. They are recorded as URLs so a
future implementation can re-check the current API rather than treating this
Stage 0 baseline as permanent.

| Guidance | Official source |
| --- | --- |
| When to Use GenLayer | https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer |
| Intelligent Contract introduction | https://docs.genlayer.com/developers/intelligent-contracts/introduction |
| First contract and dependency declaration | https://docs.genlayer.com/developers/intelligent-contracts/first-contract |
| Equivalence Principle | https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle |
| Non-determinism and custom validators | https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism |
| LLM output handling | https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms |
| Web access | https://docs.genlayer.com/developers/intelligent-contracts/features/web-access |
| Transaction statuses | https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-statuses |
| Transaction execution and receipts | https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/transactions/transaction-execution |
| Finality | https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality |
| Transaction status RPC | https://docs.genlayer.com/api-references/genlayer-node/gen/gen_getTransactionStatus |
| Current Bradbury network details | https://docs.genlayer.com/developers/networks |
| Current testing/tooling guidance | https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup |
| Testing modes and consensus tests | https://docs.genlayer.com/developers/intelligent-contracts/testing |
| GenVM linter | https://docs.genlayer.com/api-references/genlayer-linter |
| GenLayerJS interaction guidance | https://docs.genlayer.com/api-references/genlayer-js |
| GenLayerJS writes and finality-aware receipts | https://docs.genlayer.com/developers/decentralized-applications/writing-data |
