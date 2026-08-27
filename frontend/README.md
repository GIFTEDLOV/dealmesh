# DealMesh frontend lifecycle library

This package is a thin GenLayerJS integration layer. It does not calculate a
verdict, construct an authorization, or replace contract checks.

It creates separate read and wallet-backed write clients, persists every
returned transaction hash before polling, waits for `FINALIZED`, checks
`txExecutionResultName === FINISHED_WITH_RETURN`, and performs exact state
read-back. Recovery polls persisted hashes only; it never reconstructs or
rebroadcasts calldata. A submission that returns no hash is recorded as
`UNKNOWN_SUBMISSION` and requires manual recovery.

```powershell
npm install
npm run build
npm test
```
