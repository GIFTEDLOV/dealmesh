import json
import os

import pytest

from gltest import get_accounts, get_contract_factory, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.types import CalldataAddress, TransactionHashVariant, TransactionStatus


ACTION = "0x" + "a" * 64
TERMS = '[{"key":"channel","value":"secure"}]'


def _addr(account):
    return CalldataAddress(bytes.fromhex(account.address[2:]))


def _hash(receipt):
    return receipt.get("hash") or receipt.get("tx_id")


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
        args=[_addr(bob), "USD", 1000, 4102444800, "use secure channel", ACTION]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(create_receipt)
    deal_id = mesh_a.get_latest_deal_for(args=[_addr(alice)]).call(
        TransactionHashVariant.LATEST_FINAL
    )
    assert isinstance(deal_id, str) and deal_id.startswith("0x")

    accept_receipt = mesh_b.accept_participation(
        args=[deal_id, "USD", 100, 1, "use secure channel"]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(accept_receipt)

    submit_receipt = mesh_a.submit_offer(
        args=[deal_id, 500, 2000000000, ACTION, TERMS]
    ).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(submit_receipt)
    offer = json.loads(mesh_a.get_offer(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    offer_digest = offer["offer_digest"]

    assess_receipt = mesh_b.assess_offer(args=[deal_id]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=240,
    )
    assert tx_execution_succeeded(assess_receipt)
    assessment_parent = _hash(assess_receipt)
    assert assessment_parent
    assessment = json.loads(mesh_a.get_assessment(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert assessment["offer_digest"] == offer_digest
    assert assessment["verdict"] in {"MATCH", "NO_MATCH", "INCONCLUSIVE"}
    _wait_children(client, assessment_parent)

    finalized_deal = json.loads(mesh_a.get_deal(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    if assessment["verdict"] != "MATCH":
        assert finalized_deal["state"] in {"ASSESSED_NO_MATCH", "ASSESSED_INCONCLUSIVE"}
        return
    assert finalized_deal["state"] == "ASSESSED_MATCH_FINALIZED"

    bind_receipt = mesh_b.bind_match(args=[deal_id, offer_digest]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    assert tx_execution_succeeded(bind_receipt)
    binding_parent = _hash(bind_receipt)
    assert binding_parent
    _wait_children(client, binding_parent)
    final_deal = json.loads(mesh_a.get_deal(args=[deal_id]).call(TransactionHashVariant.LATEST_FINAL))
    assert final_deal["state"] == "BOUND"
    assert mesh_a.is_bound(args=[deal_id, offer_digest]).call(TransactionHashVariant.LATEST_FINAL) is True
    assert mesh_a.is_bound(args=[deal_id, "0x" + "b" * 64]).call(TransactionHashVariant.LATEST_FINAL) is False
