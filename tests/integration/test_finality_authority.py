import os

import pytest

from gltest import get_contract_factory, get_gl_client
from gltest.assertions import tx_execution_succeeded
from gltest.types import CalldataAddress, TransactionStatus


pytestmark = pytest.mark.studio

if os.environ.get("DEALMESH_STUDIO") != "1":
    pytest.skip(
        "Set DEALMESH_STUDIO=1 with a configured Studio endpoint",
        allow_module_level=True,
    )


def _tx_hash(receipt):
    return receipt.get("hash") or receipt.get("tx_id")


@pytest.mark.studio
def test_finalized_internal_message_is_not_created_at_accepted():
    receiver_factory = get_contract_factory(
        contract_file_path="../tools/finality_probe/finality_receiver.py"
    )
    emitter_factory = get_contract_factory(
        contract_file_path="../tools/finality_probe/finality_emitter.py"
    )

    receiver = receiver_factory.deploy(
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=60,
    )
    emitter = emitter_factory.deploy(
        args=[CalldataAddress(receiver.address)],
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=60,
    )
    client = get_gl_client()

    assert receiver.get_marker().call() == ""

    accepted_receipt = emitter.emit_finalized(args=["finalized-only"]).transact(
        wait_transaction_status=TransactionStatus.ACCEPTED,
        wait_interval=1000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(accepted_receipt)
    parent_hash = _tx_hash(accepted_receipt)
    assert parent_hash

    # The parent is accepted, but an on='finalized' child must not exist yet.
    assert client.get_triggered_transaction_ids(parent_hash) == []
    assert receiver.get_marker().call() == ""

    finalized_receipt = client.wait_for_transaction_receipt(
        transaction_hash=parent_hash,
        status=TransactionStatus.FINALIZED,
        interval=1000,
        retries=120,
        full_transaction=True,
    )
    assert tx_execution_succeeded(finalized_receipt)

    child_hashes = client.get_triggered_transaction_ids(parent_hash)
    assert len(child_hashes) == 1
    child_receipt = client.wait_for_transaction_receipt(
        transaction_hash=child_hashes[0],
        status=TransactionStatus.FINALIZED,
        interval=1000,
        retries=120,
        full_transaction=True,
    )
    assert tx_execution_succeeded(child_receipt)
    assert receiver.get_marker().call() == "finalized-only"

    self_emitter = emitter_factory.deploy(
        args=[CalldataAddress(receiver.address)],
        wait_transaction_status=TransactionStatus.FINALIZED,
        wait_interval=1000,
        wait_retries=60,
    )
    self_receipt = self_emitter.emit_self_finalized(
        args=["self-finalized"]
    ).transact(
        wait_transaction_status=TransactionStatus.ACCEPTED,
        wait_interval=1000,
        wait_retries=60,
    )
    assert tx_execution_succeeded(self_receipt)
    self_parent_hash = _tx_hash(self_receipt)
    assert self_parent_hash
    assert client.get_triggered_transaction_ids(self_parent_hash) == []
    assert self_emitter.get_self_marker().call() == ""

    self_finalized = client.wait_for_transaction_receipt(
        transaction_hash=self_parent_hash,
        status=TransactionStatus.FINALIZED,
        interval=1000,
        retries=120,
        full_transaction=True,
    )
    assert tx_execution_succeeded(self_finalized)
    self_children = client.get_triggered_transaction_ids(self_parent_hash)
    assert len(self_children) == 1
    self_child = client.wait_for_transaction_receipt(
        transaction_hash=self_children[0],
        status=TransactionStatus.FINALIZED,
        interval=1000,
        retries=120,
        full_transaction=True,
    )
    assert tx_execution_succeeded(self_child)
    assert self_emitter.get_self_marker().call() == "self-finalized"
