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

For the hosted Studio probe:

    cd ..
    $env:DEALMESH_STUDIO='1'
    gltest tests/integration/test_finality_authority.py -m studio -q --network studionet --rpc-url https://studio.genlayer.com/api

A full DealMesh lifecycle integration test should be run only when the Studio
account/model environment is usable. It must remain separate from Direct Mode
and must record parent and callback hashes without rebroadcasting.

