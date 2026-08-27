"""Shared direct-mode fixtures for DealMesh tests."""

from __future__ import annotations

import json
import os
from pathlib import Path
from unittest.mock import patch

import pytest


CONTRACT = "contracts/deal_mesh.py"
CONTRACT_PATH = Path(__file__).resolve().parents[1] / CONTRACT
ACTION_DIGEST = "0x" + "a" * 64
TERMS = json.dumps(
    [
        {"key": "channel", "value": "email"},
        {"key": "region", "value": "eu"},
    ]
)


def address_type():
    from gltest.direct.sdk_loader import setup_sdk_paths

    setup_sdk_paths(CONTRACT_PATH)
    from genlayer.py.types import Address

    return Address


def as_address(value):
    Address = address_type()
    if isinstance(value, Address):
        return value
    if isinstance(value, bytes):
        return Address(value)
    raw = getattr(value, "as_bytes", None)
    if raw is not None:
        return Address(raw)
    return Address(bytes.fromhex(str(value).removeprefix("0x")))


@pytest.fixture
def mesh(direct_deploy):
    # gltest-direct leaves stdin attached to its temporary message file on
    # Windows. Ignore only that cleanup error so the selected runner can
    # execute the contract; this does not alter the runner or contract code.
    unlink = os.unlink

    def unlink_temp_file(path: str, *args: object, **kwargs: object) -> None:
        try:
            unlink(path, *args, **kwargs)
        except PermissionError:
            pass

    with patch("os.unlink", unlink_temp_file):
        return direct_deploy(CONTRACT, sdk_version="v0.2.12")


@pytest.fixture
def committed_deal(mesh, direct_vm, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    deal_id = mesh.create_deal(
        as_address(direct_bob),
        "USD",
        1000,
        2000,
        "deliver an encrypted report during the agreed window",
        ACTION_DIGEST,
    )
    direct_vm.sender = direct_bob
    mesh.accept_participation(
        deal_id,
        "USD",
        100,
        1200,
        "accept the report only through the secure channel",
    )
    return deal_id


@pytest.fixture
def submitted_offer(committed_deal, mesh, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    offer_digest = mesh.submit_offer(
        committed_deal, 500, 1500, ACTION_DIGEST, TERMS
    )
    return committed_deal, offer_digest


def mock_verdict(direct_vm, verdict: str) -> None:
    direct_vm.mock_llm(
        r"bounded bilateral agreement adjudicator",
        json.dumps({"verdict": verdict}),
    )
