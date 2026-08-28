"""Verify the immutable DealMesh contract source artifact."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


EXPECTED_BYTES = 25773
EXPECTED_SHA256 = "ab86f3748afd58adee1246442ac125f098e64eb4dba3a690113555fd85cace6d"


def source_facts(root: Path) -> tuple[int, str]:
    data = (root / "contracts" / "deal_mesh.py").read_bytes()
    return len(data), hashlib.sha256(data).hexdigest()


def check(root: Path) -> list[str]:
    errors: list[str] = []
    byte_count, digest = source_facts(root)
    if byte_count != EXPECTED_BYTES:
        errors.append(f"source byte count mismatch: {byte_count}")
    if digest != EXPECTED_SHA256:
        errors.append(f"source SHA-256 mismatch: {digest}")
    manifest = json.loads((root / "artifacts" / "bradbury-release-manifest.json").read_text(encoding="utf-8"))
    contract = manifest.get("contract", {})
    if contract.get("sourceBytes") != byte_count:
        errors.append("manifest sourceBytes does not match source")
    if contract.get("sourceSha256") != digest:
        errors.append("manifest sourceSha256 does not match source")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if the pinned source facts differ")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    byte_count, digest = source_facts(root)
    errors = check(root) if args.check else []
    print(f"SOURCE_BYTES={byte_count}")
    print(f"SOURCE_SHA256={digest}")
    if errors:
        for error in errors:
            print(f"SOURCE_HASH_FAILURE: {error}")
        return 1
    print("SOURCE_HASH_PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
