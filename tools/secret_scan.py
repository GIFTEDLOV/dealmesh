"""Fail closed on high-confidence committed secret material without echoing it."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRIVATE_KEY = re.compile(r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----")
ASSIGNED_SECRET = re.compile(
    r"(?im)^\s*(?:export\s+)?(?:PRIVATE_KEY|PRIVATEKEY|SEED_PHRASE|SEEDPHRASE|MNEMONIC|WALLET_SECRET|API_SECRET|SECRET_KEY|AUTH_TOKEN|PASSWORD)\s*[:=]\s*(?![\"']?(?:$|CHANGE_ME|REPLACE_ME|EXAMPLE|PLACEHOLDER|<|\$\{))[\"']?[^\"'\s]+"
)
MNEMONIC = re.compile(r"(?i)\b(?:seed phrase|recovery phrase|mnemonic phrase)\b\s*[:=]")


def tracked_files() -> list[Path]:
    output = subprocess.check_output(["git", "ls-files", "-co", "--exclude-standard"], cwd=ROOT, text=True)
    return [ROOT / line for line in output.splitlines() if line]


def main() -> int:
    findings: list[tuple[str, str]] = []
    for path in tracked_files():
        if not path.is_file() or "node_modules" in path.parts or path.parts[-1] in {"package-lock.json", "secret_scan.py"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if PRIVATE_KEY.search(text):
            findings.append((str(path.relative_to(ROOT)), "private-key-block"))
        if ASSIGNED_SECRET.search(text):
            findings.append((str(path.relative_to(ROOT)), "sensitive-assignment"))
        if MNEMONIC.search(text):
            findings.append((str(path.relative_to(ROOT)), "mnemonic-material"))
    if findings:
        for filename, kind in findings:
            print(f"SECRET_SCAN_FAILURE: {kind} in {filename}")
        return 1
    print(f"SECRET_SCAN_PASS: scanned {len(tracked_files())} tracked files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
