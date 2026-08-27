from __future__ import annotations

import json
import os

import pytest

pytestmark = pytest.mark.studio

if os.environ.get("DEALMESH_STUDIO") != "1":
    pytest.skip(
        "Set DEALMESH_STUDIO=1 with a configured five-validator Studio endpoint",
        allow_module_level=True,
    )

from gltest import get_accounts, get_contract_factory
from gltest.assertions import tx_execution_succeeded
from gltest.types import TransactionStatus


TERMS = json.dumps([{"key": "channel", "value": "secure-email"}])
ACTION_DIGEST = "0x" + "b" * 64


def _finalized(**kwargs):
    kwargs.update(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    return kwargs


def test_studio_five_validator_shaped_bilateral_flow():
    accounts = get_accounts()
    if len(accounts) < 2:
        pytest.fail("Studio integration requires two configured funded accounts")
    alice, bob = accounts[:2]
    factory = get_contract_factory(contract_file_path="deal_mesh.py")
    mesh = factory.deploy(
        account=alice,
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=180,
    )
    alice_mesh = mesh.connect(alice)
    bob_mesh = mesh.connect(bob)

    create_receipt = alice_mesh.create_deal(
        args=[
            bob.address,
            "USD",
            1000,
            4102444800,
            "deliver the agreed report",
            ACTION_DIGEST,
        ]
    ).transact(**_finalized())
    assert tx_execution_succeeded(create_receipt)
    deal_id = alice_mesh.get_latest_deal_for(args=[alice.address]).call()
    assert deal_id
    assert (
        json.loads(alice_mesh.get_deal(args=[deal_id]).call())["party_a"]
        == alice.address.lower()
    )

    accept_receipt = bob_mesh.accept_participation(
        args=[deal_id, "USD", 100, 1200, "receive the report through secure-email"]
    ).transact(**_finalized())
    assert tx_execution_succeeded(accept_receipt)

    offer_receipt = alice_mesh.submit_offer(
        args=[deal_id, 500, 1500, ACTION_DIGEST, TERMS]
    ).transact(**_finalized())
    assert tx_execution_succeeded(offer_receipt)
    offer = json.loads(alice_mesh.get_offer(args=[deal_id]).call())

    assessment_receipt = alice_mesh.assess_offer(args=[deal_id]).transact(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=300,
        wait_triggered_transactions=True,
        wait_triggered_transactions_status=TransactionStatus.FINALIZED,
    )
    assert tx_execution_succeeded(assessment_receipt)
    assessment = json.loads(alice_mesh.get_assessment(args=[deal_id]).call())
    assert assessment["offer_digest"] == offer["offer_digest"]
    assert assessment["verdict"] in {"MATCH", "NO_MATCH", "INCONCLUSIVE"}

    if assessment["verdict"] == "MATCH":
        bind_receipt = bob_mesh.bind_match(
            args=[deal_id, offer["offer_digest"]]
        ).transact(
            wait_transaction_status=TransactionStatus.FINALIZED,
            wait_interval=1000,
            wait_retries=180,
            wait_triggered_transactions=True,
            wait_triggered_transactions_status=TransactionStatus.FINALIZED,
        )
        assert tx_execution_succeeded(bind_receipt)
        assert bob_mesh.is_bound(args=[deal_id, offer["offer_digest"]]).call() is True
