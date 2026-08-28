# Tools

The frontend lifecycle code under frontend/src is a GenLayerJS integration, not
an adjudication service. It persists transaction hashes immediately after the
single broadcast, recovers hashes after refresh, waits for FINALIZED,
checks execution results, reconciles finalized-only callback children, and
reads state back. It never reconstructs or rebroadcasts uncertain writes.

The tools/finality_probe fixtures are a small executable proof of GenLayer's
on=finalized internal-message mechanism. They are runtime evidence for the
contract architecture, not a substitute for DealMesh state or authorization.

`source_hash.py --check` verifies the pinned contract source bytes and SHA-256.
`verify_release_evidence.py` checks the offline Bradbury manifest, deployment
facts, three no-hash capacity rejections, lifecycle absence, and consistent
release claims. `secret_scan.py` fails on high-confidence key, seed, mnemonic,
or sensitive environment assignments without echoing secret contents.
