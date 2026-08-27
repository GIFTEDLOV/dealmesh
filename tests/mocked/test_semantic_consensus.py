from __future__ import annotations

import pytest

from tests.conftest import mock_verdict


def test_validator_replay_accepts_same_strict_verdict(
    submitted_offer, mesh, direct_vm, direct_alice
):
    deal_id, _offer_digest = submitted_offer
    direct_vm.sender = direct_alice
    mock_verdict(direct_vm, "MATCH")
    mesh.assess_offer(deal_id)

    direct_vm.clear_mocks()
    mock_verdict(direct_vm, "MATCH")
    assert direct_vm.run_validator() is True


def test_validator_replay_rejects_different_semantic_verdict(
    submitted_offer, mesh, direct_vm, direct_alice
):
    deal_id, _offer_digest = submitted_offer
    direct_vm.sender = direct_alice
    mock_verdict(direct_vm, "MATCH")
    mesh.assess_offer(deal_id)

    direct_vm.clear_mocks()
    mock_verdict(direct_vm, "NO_MATCH")
    assert direct_vm.run_validator() is False


@pytest.mark.parametrize(
    "raw",
    [
        '{"verdict":"MATCH","extra":1}',
        '{"verdict":"match"}',
        "not-json",
    ],
)
def test_malformed_model_output_reverts_without_business_state(
    submitted_offer, mesh, direct_vm, direct_alice, raw
):
    deal_id, _offer_digest = submitted_offer
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(r"bounded bilateral agreement adjudicator", raw)
    with pytest.raises(Exception):
        mesh.assess_offer(deal_id)
    assert "OFFER_SUBMITTED" in mesh.get_deal(deal_id)
