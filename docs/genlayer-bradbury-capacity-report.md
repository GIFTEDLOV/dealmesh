# Bradbury capacity escalation report

Status: read-only evidence report; no fourth write was attempted during this
release-hardening run.

## Network and deployment

- Chain ID: `4221`.
- GenLayer RPC: `https://rpc-bradbury.genlayer.com`.
- DealMesh contract: `0xCEFf63f9d66b4F60E854Ef3Eb4d2a35096037247`.
- Finalized deployment transaction:
  `0x90adf6a255c996331e1186553e4e687d2548635a56fcf427d4ed82e04ba66397`.
- Operation: `create_deal`.
- Configured deployer public address:
  `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`.

## Attempts

Three create attempts were rejected before transaction acceptance. No returned
transaction hash exists for any attempt. Attempt timestamps are unavailable in
the preserved logs and manifest; no timestamps are inferred here.

| Attempt | Timestamp UTC | RPC code | Exact message | retryAfterMs | Returned hash |
| --- | --- | ---: | --- | ---: | --- |
| 1 | unavailable | -32005 | `transaction gas rate limit exceeded: node is at capacity` | 3 | none |
| 2 | unavailable | -32005 | `transaction gas rate limit exceeded: node is at capacity` | 794 | none |
| 3 | unavailable | -32005 | `transaction gas rate limit exceeded: node is at capacity` | 340 | none |

Read-only absence evidence recorded latest and pending deployer nonce as `203`,
with `get_latest_deal_for(deployer)` empty and no deal, offer, assessment,
callback, or lifecycle state created. The finalized deployment and initialized
contract state are unchanged. No same-hash reconciliation is applicable because
no create hash was returned.

## Tooling context

- GenLayer CLI: `0.39.1`.
- GenLayerJS: `1.1.8`.
- GenVM runtime: `v0.3.0-rc7`.
- Contract runner:
  `1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.

## Requested clarification

Please clarify whether the observed `-32005` capacity rejection is global,
sender-scoped, IP-scoped, or account-scoped, and provide an official safe retry
window or capacity signal for a single future `create_deal` broadcast. DealMesh
will not retry repeatedly or rebroadcast an ambiguous submission.
