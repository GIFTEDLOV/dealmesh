import json
import os
from pathlib import Path

import pytest

from gltest import get_accounts, get_contract_factory, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.types import CalldataAddress, TransactionHashVariant, TransactionStatus


ACTION = "0x" + "a" * 64
TERMS = '[{"key":"channel","value":"secure-email"}]'
REQUIREMENTS = "use the exact secure-email channel"
EVIDENCE_PATH = Path(os.environ.get("DEALMESH_STUDIO_EVIDENCE_PATH", "artifacts/studio-run-evidence.json"))


def _addr(account):
    return CalldataAddress(bytes.fromhex(account.address[2:]))


def _hash(receipt):
    return receipt.get("hash") or receipt.get("tx_id")


def _persist_hash(label, receipt_or_hash):
    transaction_hash = receipt_or_hash if isinstance(receipt_or_hash, str) else _hash(receipt_or_hash)
    assert transaction_hash
    EVIDENCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    evidence = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8")) if EVIDENCE_PATH.exists() else {"transactions": []}
    evidence.setdefault("transactions", []).append({"label": label, "hash": transaction_hash})
    EVIDENCE_PATH.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    return transaction_hash


def _wait_children(client, parent_hash):
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


@pytest.mark.studio
@pytest.mark.skipif(
    os.environ.get("DEALMESH_STUDIO") != "1",
    reason="set DEALMESH_STUDIO=1 to run the real multi-validator Studio flow",
)
def test_full_dealmesh_lifecycle_on_studio():
    accounts = get_accounts()
    if len(accounts) < 2:
        pytest.skip("the selected Studio config does not expose two funded accounts")
    alice, bob = accounts[:2]
    factory = get_contract_factory(contract_file_path="../contracts/deal_mesh.py")
    mesh_a = factory.deploy(
        account=alice,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    mesh_b = factory.build_contract(mesh_a.address, account=bob)
    client = get_gl_client()

    create_receipt = mesh_a.create_deal(
        args=[_addr(bob), "USD", 1000, 4102444800, REQUIREMENTS, ACTION]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(create_receipt)
    _persist_hash("create_deal", create_receipt)
    deal_id = mesh_a.get_latest_deal_for(args=[_addr(alice)]).call(
        TransactionHashVariant.LATEST_FINAL
    )
    assert isinstance(deal_id, str) and deal_id.startswith("0x")

    accept_receipt = mesh_b.accept_participation(
        args=[deal_id, "USD", 100, 1, REQUIREMENTS]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(accept_receipt)
    _persist_hash("accept_participation", accept_receipt)

    submit_receipt = mesh_a.submit_offer(
        args=[deal_id, 500, 2000000000, ACTION, TERMS]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(submit_receipt)
    _persist_hash("submit_offer", submit_receipt)
    offer = json.loads(mesh_a.get_offer(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert offer["deal_id"] == deal_id
    assert offer["price"] == 500
    assert offer["deadline"] == 2000000000
    assert offer["action_digest"] == ACTION
    assert offer["terms"] == [{"key": "channel", "value": "secure-email"}]
    offer_digest = offer["offer_digest"]

    assess_receipt = mesh_b.assess_offer(args=[deal_id]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=240,
    )
    assert tx_execution_succeeded(assess_receipt)
    assessment_parent = _persist_hash("assess_offer", assess_receipt)
    assessment_callback = _wait_children(client, assessment_parent)
    assert assessment_callback
    assessment = json.loads(mesh_a.get_assessment(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert assessment["assessment_id"]
    assert assessment["deal_id"] == deal_id
    assert assessment["offer_digest"] == offer_digest
    assert assessment["verdict"] == "MATCH"

    finalized_deal = json.loads(mesh_a.get_deal(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert finalized_deal["state"] == "ASSESSED_MATCH_FINALIZED"
    assert finalized_deal["assessment_id"] == assessment["assessment_id"]
    assert finalized_deal["offer_digest"] == offer_digest

    bind_receipt = mesh_b.bind_match(args=[deal_id, offer_digest]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(bind_receipt)
    binding_parent = _persist_hash("bind_match", bind_receipt)
    binding_callback = _wait_children(client, binding_parent)
    assert binding_callback
    final_deal = json.loads(mesh_a.get_deal(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert final_deal["state"] == "BOUND"
    assert final_deal["offer_digest"] == offer_digest
    assert final_deal["bound_by"] == bob.address.lower()
    assert mesh_a.is_bound(args=[deal_id, offer_digest]).call(TransactionHashVariant.LATEST_FINAL) is True
    assert mesh_a.is_bound(args=[deal_id, "0x" + "b" * 64]).call(TransactionHashVariant.LATEST_FINAL) is False
