# Tests

The direct suite exercises contract determinism with the installed Direct-Mode
runner and uses the mock_llm hook for semantic test inputs. It does not prove
multi-validator consensus.

The integration suite is marked studio and is skipped unless
DEALMESH_STUDIO=1 is set. It runs against the configured Studio RPC with
multiple validators and waits for finalized receipts plus triggered callback
transactions. The finality test is intentionally narrow: it proves no
finalized-only child exists at ACCEPTED, then proves parent finality creates a
same-contract callback that can execute.

    python -m pytest tests/direct tests/mocked -q
    cd frontend
    npm test
    npm run build

For the hosted finality probe:

    cd ..
    $env:DEALMESH_STUDIO='1'
    gltest tests/integration/test_finality_authority.py -m studio -q --network studionet --rpc-url https://studio.genlayer.com/api

For the local DealMesh lifecycle integration test:

    cd ..
    $env:DEALMESH_STUDIO='1'
    python -m pytest tests/integration -m studio -q

The full DealMesh lifecycle integration test must use at least five configured
validators, live validator processes, confirmed model/provider health, a
responding RPC, and funded test accounts. It must remain separate from Direct
Mode and must record parent and callback hashes without rebroadcasting. The
local Studio environment currently fails the validator precondition. Existing
hosted implementation evidence exercises the semantic and callback path, but
does not provide sufficient immutable receipts/hashes to claim an independently
verified BOUND lifecycle.
