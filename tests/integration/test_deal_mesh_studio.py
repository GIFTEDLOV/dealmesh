from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

pytestmark = pytest.mark.studio

if os.environ.get("DEALMESH_STUDIO") != "1":
    pytest.skip(
        "Set DEALMESH_STUDIO=1 with a configured multi-validator Studio endpoint",
        allow_module_level=True,
    )

from gltest import get_accounts, get_contract_factory, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.types import CalldataAddress, TransactionHashVariant, TransactionStatus


TERMS = json.dumps([{"key": "channel", "value": "secure-email"}])
ACTION_DIGEST = "0x" + "a" * 64
REQUIREMENTS = "use the exact secure-email channel"
EVIDENCE_PATH = Path(os.environ.get("DEALMESH_STUDIO_EVIDENCE_PATH", "artifacts/studio-run-evidence.json"))


def _finalized(**kwargs):
    kwargs.update(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    return kwargs


def _addr(account):
    return CalldataAddress(bytes.fromhex(account.address[2:]))


def _receipt_hash(receipt):
    return receipt.get("hash") or receipt.get("tx_id")


def _persist_hash(label, receipt_or_hash):
    transaction_hash = receipt_or_hash if isinstance(receipt_or_hash, str) else _receipt_hash(receipt_or_hash)
    assert transaction_hash
    EVIDENCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8")) if EVIDENCE_PATH.exists() else {"transactions": []}
    evidence.setdefault("transactions", []).append({"label": label, "hash": transaction_hash})
    EVIDENCE_PATH.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    return transaction_hash


def _wait_one_callback(client, parent_hash):
    children = client.get_triggered_transaction_ids(parent_hash)
    assert len(children) == 1
    child = client.wait_for_transaction_receipt(
        transaction_hash=children[0],
        status=TransactionStatus.FINALIZED,
        interval=1000,
        retries=180,
        full_transaction=True,
    )
    assert tx_execution_succeeded(child)
    return _persist_hash("finalized_callback", children[0])


def test_studio_multi_validator_bilateral_flow():
    accounts = get_accounts()
    if len(accounts) < 2:
        pytest.fail("Studio integration requires two configured funded accounts")
    alice, bob = accounts[:2]
    factory = get_contract_factory(contract_file_path="../contracts/deal_mesh.py")
    mesh = factory.deploy(
        account=alice,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    alice_mesh = mesh
    bob_mesh = factory.build_contract(mesh.address, account=bob)

    create_receipt = alice_mesh.create_deal(
        args=[_addr(bob), "USD", 1000, 4102444800, REQUIREMENTS, ACTION_DIGEST]
    ).transact(**_finalized())
    assert tx_execution_succeeded(create_receipt)
    _persist_hash("create_deal", create_receipt)
    deal_id = alice_mesh.get_latest_deal_for(args=[_addr(alice)]).call(TransactionHashVariant.LATEST_FINAL)
    assert deal_id

    accept_receipt = bob_mesh.accept_participation(
        args=[deal_id, "USD", 100, 1, REQUIREMENTS]
    ).transact(**_finalized())
    assert tx_execution_succeeded(accept_receipt)
    _persist_hash("accept_participation", accept_receipt)

    offer_receipt = alice_mesh.submit_offer(
        args=[deal_id, 500, 2000000000, ACTION_DIGEST, TERMS]
    ).transact(**_finalized())
    assert tx_execution_succeeded(offer_receipt)
    _persist_hash("submit_offer", offer_receipt)
    offer = json.loads(alice_mesh.get_offer(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert offer["deal_id"] == deal_id
    assert offer["price"] == 500
    assert offer["deadline"] == 2000000000
    assert offer["action_digest"] == ACTION_DIGEST
    assert offer["terms"] == [{"key": "channel", "value": "secure-email"}]

    client = get_gl_client()
    assessment_receipt = alice_mesh.assess_offer(args=[deal_id]).transact(**_finalized())
    assert tx_execution_succeeded(assessment_receipt)
    assessment_parent = _persist_hash("assess_offer", assessment_receipt)
    assert _wait_one_callback(client, assessment_parent)
    assessment = json.loads(alice_mesh.get_assessment(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert assessment["assessment_id"]
    assert assessment["deal_id"] == deal_id
    assert assessment["offer_digest"] == offer["offer_digest"]
    assert assessment["verdict"] == "MATCH"
    assessed_deal = json.loads(alice_mesh.get_deal(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert assessed_deal["state"] == "ASSESSED_MATCH_FINALIZED"

    bind_receipt = bob_mesh.bind_match(args=[deal_id, offer["offer_digest"]]).transact(**_finalized())
    assert tx_execution_succeeded(bind_receipt)
    binding_parent = _persist_hash("bind_match", bind_receipt)
    assert _wait_one_callback(client, binding_parent)
    final_deal = json.loads(alice_mesh.get_deal(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert final_deal["state"] == "BOUND"
    assert final_deal["bound_by"] == bob.address.lower()
    assert alice_mesh.is_bound(args=[deal_id, offer["offer_digest"]]).call(TransactionHashVariant.LATEST_FINAL) is True
    assert alice_mesh.is_bound(args=[deal_id, "0x" + "b" * 64]).call(TransactionHashVariant.LATEST_FINAL) is False
