# DealMesh frontend

This is the real wallet-backed DealMesh application. It reads live contract
state and exposes the Party A, Party B, exact-offer, assessment, finality,
and exact-binding workflow. It does not calculate a verdict or construct an
authorization.

The GenLayerJS layer creates separate read and wallet-backed write clients,
persists every returned transaction hash before polling, waits for
`FINALIZED`, checks `txExecutionResultName === FINISHED_WITH_RETURN`, and
performs exact finalized-state read-back. Recovery polls persisted hashes only;
it never reconstructs or rebroadcasts calldata. A submission that returns no
hash is recorded as `UNKNOWN_SUBMISSION` and requires manual recovery.

Set `VITE_DEALMESH_CONTRACT_ADDRESS` for a deployed contract, open the built
application in a browser wallet, select Studio or Bradbury, and connect the
wallet. No private key is handled by this code.

```powershell
npm install
npm run build
npm test
```
