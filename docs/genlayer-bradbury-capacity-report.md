# Bradbury capacity escalation report

Status: release evidence report; attempt 4 failed from incorrect calldata
typing, and one corrected create write was then broadcast. No sixth write or
later lifecycle write was attempted.

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

The first three create attempts were rejected before transaction acceptance.
No returned transaction hash exists for those three attempts. Attempt
timestamps are unavailable in the preserved logs and manifest; no timestamps
are inferred here. Attempts 4 and 5 returned hashes and are recorded
separately below.

| Attempt | Timestamp UTC | RPC code | Exact message | retryAfterMs | Returned hash |
| --- | --- | ---: | --- | ---: | --- |
| 1 | unavailable | -32005 | `transaction gas rate limit exceeded: node is at capacity` | 3 | none |
| 2 | unavailable | -32005 | `transaction gas rate limit exceeded: node is at capacity` | 794 | none |
| 3 | unavailable | -32005 | `transaction gas rate limit exceeded: node is at capacity` | 340 | none |

| 4 | unavailable | — | `FINALIZED` / `FINISHED_WITH_ERROR`; `action_digest` was encoded as an integer instead of a string | — | `0xb90302aae0826778cb05bd503ce3ebc61a40b812f8b8ccf89bdcd0dabf349a0f` |
| 5 | unavailable | — | `ACCEPTED` / `FINISHED_WITH_RETURN` / `AGREE`; finality pending after bounded reconciliation | — | `0x6fdc962873707ecfaccf2aedbd071a26fcbffe89473066747d3f2e9182caf0b0` |

Before attempt 4, read-only absence evidence recorded latest and pending
deployer nonce as `203/203`, with `get_latest_deal_for(deployer)` empty. After
that failed hash finalized, the preserved evidence recorded `204/204`. Before
corrected attempt 5, the fresh absence read was `205/205` with an empty creator
lookup. After its single broadcast, nonce was `206/206` and the creator lookup
returned deal `0xbb929ef5d867b71c6e8566ecac3c6cf39aa4dda78e4dbccc9e4ee27ac95b991a`.
The exact parent remains `ACCEPTED` with `FINISHED_WITH_RETURN`; the read view
shows `CREATED_A_COMMITTED`, but finality has not been observed, so no accept,
offer, assessment, callback, bind, or downstream authorization was sent.
The corrected hash was not replaced or rebroadcast.

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
