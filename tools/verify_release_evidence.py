"""Offline verifier for the DealMesh Bradbury release evidence package."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "artifacts" / "bradbury-release-manifest.json"
PROOF_PATH = ROOT / "artifacts" / "dealmesh-final-release-proof.json"
EXPECTED_RPC = "https://rpc-bradbury.genlayer.com"
EXPECTED_CHAIN_ID = 4221
EXPECTED_DEPLOYMENT = "0x90adf6a255c996331e1186553e4e687d2548635a56fcf427d4ed82e04ba66397"
EXPECTED_CONTRACT = "0xCEFf63f9d66b4F60E854Ef3Eb4d2a35096037247"
EXPECTED_SOURCE = "ab86f3748afd58adee1246442ac125f098e64eb4dba3a690113555fd85cace6d"
EXPECTED_SOURCE_BYTES = 25773
EXPECTED_RUNNER = "1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6"
EXPECTED_GENVM = "v0.3.0-rc7"
EXPECTED_DEPLOYER = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
EXPECTED_PARTY_B = "0x6311de989ab01ae4da77d36cc45d495fbcd4b7a8"
EXPECTED_CAPACITY_MESSAGE = "transaction gas rate limit exceeded: node is at capacity"


def load(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path.name} must contain an object")
    return value


def git_head() -> str:
    return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()


def verify() -> list[str]:
    errors: list[str] = []
    try:
        manifest = load(MANIFEST_PATH)
        proof = load(PROOF_PATH)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        return [f"cannot load evidence JSON: {error}"]

    def require(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    network = manifest.get("network", {})
    contract = manifest.get("contract", {})
    deployment = manifest.get("deployment", {})
    create = manifest.get("createDeal", {})
    attempts = create.get("attempts", [])
    absence = create.get("absenceEvidence", {})
    require(manifest.get("schema") == "dealmesh/bradbury-release/v1", "manifest schema mismatch")
    require(manifest.get("deploymentBroadcasted") is True, "deploymentBroadcasted must be true")
    require(manifest.get("createDealBroadcasted") is False, "createDealBroadcasted must be false")
    require("broadcasted" not in manifest, "ambiguous top-level broadcasted field remains")
    require(network.get("rpc") == EXPECTED_RPC, "manifest Bradbury RPC mismatch")
    require(network.get("chainId") == EXPECTED_CHAIN_ID, "manifest chain ID mismatch")
    require(contract.get("sourcePath") == "contracts/deal_mesh.py", "contract source path mismatch")
    require(contract.get("sourceBytes") == EXPECTED_SOURCE_BYTES, "manifest source byte count mismatch")
    require(contract.get("sourceSha256") == EXPECTED_SOURCE, "manifest source digest mismatch")
    require(contract.get("runner") == EXPECTED_RUNNER, "contract runner mismatch")
    require(contract.get("genvmVersion") == EXPECTED_GENVM, "GenVM version mismatch")
    require(deployment.get("transactionHash") == EXPECTED_DEPLOYMENT, "deployment hash mismatch")
    require(deployment.get("contractAddress") == EXPECTED_CONTRACT, "deployment address mismatch")
    require(re.fullmatch(r"0x[0-9a-fA-F]{64}", str(deployment.get("transactionHash", ""))) is not None, "deployment hash shape mismatch")
    require(re.fullmatch(r"0x[0-9a-fA-F]{40}", str(deployment.get("contractAddress", ""))) is not None, "deployment address shape mismatch")
    require(deployment.get("status") == "FINALIZED", "deployment is not FINALIZED")
    require(deployment.get("executionResult") == "FINISHED_WITH_RETURN", "deployment execution mismatch")
    require(deployment.get("resultName") == "AGREE", "deployment result mismatch")
    require(create.get("operation") == "create_deal", "create operation missing")
    require(create.get("broadcasted") is False, "create_deal must not be broadcasted")
    require(create.get("attemptCount") == 3 and len(attempts) == 3, "create attempt count must be three")
    for index, attempt in enumerate(attempts, start=1):
        require(attempt.get("sequence") == index, f"attempt {index} sequence mismatch")
        require(attempt.get("returnedHash") is None, f"attempt {index} unexpectedly has a hash")
        require(attempt.get("status") == "REJECTED_NO_HASH", f"attempt {index} status mismatch")
        require(attempt.get("executionResult") == "NOT_BROADCAST", f"attempt {index} execution mismatch")
        require(attempt.get("rpcCode") == -32005, f"attempt {index} RPC code mismatch")
        require(attempt.get("rpcMessage") == EXPECTED_CAPACITY_MESSAGE, f"attempt {index} message mismatch")
        require(attempt.get("timestampUtc") is None, f"attempt {index} timestamp must be unavailable")
        require(attempt.get("timestampAvailability") == "UNAVAILABLE", f"attempt {index} timestamp status mismatch")
    require([attempt.get("retryAfterMs") for attempt in attempts] == [3, 794, 340], "retryAfterMs evidence mismatch")
    require(absence.get("deployerLatestNonce") == 203, "latest nonce absence evidence mismatch")
    require(absence.get("deployerPendingNonce") == 203, "pending nonce absence evidence mismatch")
    require(absence.get("latestDealForDeployer") == "", "latest-deal absence evidence mismatch")
    require(absence.get("noDealOrLifecycleState") is True, "deal absence evidence missing")
    require(manifest.get("lifecycleStatus") == "NOT_STARTED", "manifest lifecycle must be NOT_STARTED")
    require(len(manifest.get("writes", [])) == 1 and manifest["writes"][0].get("operation") == "deploy", "manifest contains an unverified live write")
    require(manifest.get("transactionHashes") == [EXPECTED_DEPLOYMENT], "transaction hash list contains unverified live hash")

    source = ROOT / "contracts" / "deal_mesh.py"
    source_bytes = source.read_bytes()
    require(len(source_bytes) == EXPECTED_SOURCE_BYTES, "source byte count does not match evidence")
    require(hashlib.sha256(source_bytes).hexdigest() == EXPECTED_SOURCE, "source digest does not match evidence")

    checksum_file = ROOT / "MANIFEST.sha256"
    require(checksum_file.is_file(), "MANIFEST.sha256 is missing")
    if checksum_file.is_file():
        for line_number, line in enumerate(checksum_file.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            parts = line.split(maxsplit=1)
            require(len(parts) == 2 and re.fullmatch(r"[0-9a-f]{64}", parts[0]) is not None, f"invalid MANIFEST.sha256 line {line_number}")
            if len(parts) != 2:
                continue
            relative = parts[1].lstrip("*")
            target = ROOT / relative
            require(target.is_file(), f"MANIFEST.sha256 target missing: {relative}")
            if target.is_file():
                actual_digest = hashlib.sha256(target.read_bytes()).hexdigest()
                require(actual_digest == parts[0], f"MANIFEST.sha256 mismatch: {relative}")

    require(proof.get("schema") == "dealmesh/final-release-proof/v1", "final proof schema mismatch")
    require(proof.get("contributionType") == "Project", "final proof contribution type mismatch")
    require(proof.get("repository") == "GIFTEDLOV/dealmesh", "final proof repository mismatch")
    require(re.fullmatch(r"[0-9a-f]{40}", str(proof.get("repositoryHead", ""))) is not None, "final proof repository head is not a commit")
    proof_source = proof.get("source", {})
    require(proof_source.get("path") == "contracts/deal_mesh.py", "final proof source path mismatch")
    require(proof_source.get("bytes") == EXPECTED_SOURCE_BYTES, "final proof source bytes mismatch")
    require(proof_source.get("sha256") == EXPECTED_SOURCE, "final proof source digest mismatch")
    require(proof.get("runtime", {}).get("runner") == EXPECTED_RUNNER, "final proof runner mismatch")
    require(proof.get("runtime", {}).get("genvm") == EXPECTED_GENVM, "final proof GenVM mismatch")
    proof_network = proof.get("network", {})
    require(proof_network.get("rpc") == EXPECTED_RPC and proof_network.get("chainId") == EXPECTED_CHAIN_ID, "final proof network mismatch")
    require(proof_network.get("rpc") == network.get("rpc") and proof_network.get("chainId") == network.get("chainId"), "proof and manifest network mismatch")
    proof_deployment = proof.get("deployment", {})
    for key, expected in (("address", EXPECTED_CONTRACT), ("transactionHash", EXPECTED_DEPLOYMENT), ("status", "FINALIZED"), ("execution", "FINISHED_WITH_RETURN")):
        require(proof_deployment.get(key) == expected, f"final proof deployment {key} mismatch")
    require(re.fullmatch(r"0x[0-9a-fA-F]{64}", str(proof_deployment.get("transactionHash", ""))) is not None, "final proof deployment hash shape mismatch")
    require(re.fullmatch(r"0x[0-9a-fA-F]{40}", str(proof_deployment.get("address", ""))) is not None, "final proof deployment address shape mismatch")
    require(proof_deployment.get("result") == deployment.get("resultName"), "final proof and manifest deployment result mismatch")
    require(proof_deployment.get("txExecutionHash") == deployment.get("txExecutionHash"), "final proof and manifest execution hash mismatch")
    require(proof_deployment.get("initialStateReadBack") == deployment.get("initialStateReadBack"), "final proof and manifest initial state mismatch")
    proof_rejections = proof.get("capacityRejections", {}).get("attempts", [])
    require(len(proof_rejections) == 3, "final proof must contain three capacity rejections")
    for attempt in proof_rejections:
        require(attempt.get("returnedHash") is None and attempt.get("rpcCode") == -32005, "final proof contains an invalid rejection")
    proof_absence = proof.get("absenceEvidence", {})
    require(proof_absence.get("latestNonce") == 203 and proof_absence.get("pendingNonce") == 203, "final proof nonce evidence mismatch")
    require(proof_absence.get("latestDealForDeployer") == "" and proof_absence.get("lifecycleCreated") is False, "final proof lifecycle absence mismatch")
    lifecycle = proof.get("lifecycle", {})
    require(lifecycle.get("status") == "NOT_STARTED", "final proof lifecycle status mismatch")
    require(lifecycle.get("assessmentHashes") == [] and lifecycle.get("callbackHashes") == [], "final proof contains lifecycle hashes")
    require(lifecycle.get("finalVerdict") == "NOT_REACHED", "final proof verdict mismatch")
    require(lifecycle.get("finalState") == "initialized", "final proof final state mismatch")
    require(lifecycle.get("isBound") == "NOT_RUN", "final proof is_bound must be NOT_RUN")
    require(proof.get("publicFrontend") == "NOT_DEPLOYED", "final proof frontend status mismatch")
    require(lifecycle.get("status") == manifest.get("lifecycleStatus"), "proof and manifest lifecycle mismatch")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    submission = (ROOT / "SUBMISSION.md").read_text(encoding="utf-8")
    for path, text in (("README.md", readme), ("SUBMISSION.md", submission)):
        require("complete GenLayer Project" in text, f"{path} does not identify the contribution as a complete Project")
        require(EXPECTED_CONTRACT in text and EXPECTED_DEPLOYMENT in text, f"{path} lacks finalized deployment evidence")
        require("lifecycle has not started" in text.lower(), f"{path} overclaims live lifecycle")
    candidate = (ROOT / "docs" / "candidate-gate.md").read_text(encoding="utf-8")
    require("STUDIO_INTEGRATION_GATE" in candidate and "hosted multi-validator" in candidate, "candidate gate hosted status missing")
    require("RELEASE_GATE" in candidate and "capacity" in candidate.lower(), "candidate gate release blocker missing")

    return errors


def main() -> int:
    errors = verify()
    if errors:
        for error in errors:
            print(f"EVIDENCE_FAILURE: {error}")
        return 1
    print("EVIDENCE_VERIFIER_PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
