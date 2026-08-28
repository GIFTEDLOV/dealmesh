import { describe, expect, it } from "vitest";
import {
  verifyActiveBCommitted,
  verifyCreatedDeal,
  verifySubmittedOffer,
} from "../src/dealReadback.js";

const PARTY_A = `0x${"1".repeat(40)}`;
const PARTY_B = `0x${"2".repeat(40)}`;
const ACTION = `0x${"a".repeat(64)}`;
const DEAL = `0x${"d".repeat(64)}`;
const OFFER = `0x${"e".repeat(64)}`;
const TERMS = '[{"key":"channel","value":"secure-email"}]';

const created = {
  deal_id: DEAL,
  party_a: PARTY_A.toLowerCase(),
  party_b: PARTY_B.toLowerCase(),
  price_unit: "USD",
  a_max_price: 1000,
  a_latest_deadline: 4102444800,
  a_requirements: "use the exact secure-email channel",
  action_digest: ACTION,
  state: "CREATED_A_COMMITTED",
};

describe("exact DealMesh finalized read-backs", () => {
  it("requires every create_deal commitment field and state", () => {
    const expected = {
      partyA: PARTY_A,
      partyB: PARTY_B,
      priceUnit: "USD",
      maxPrice: "1000",
      latestDeadline: "4102444800",
      requirements: "use the exact secure-email channel",
      actionDigest: ACTION,
    };
    expect(verifyCreatedDeal(created, expected)).toBe(true);
    for (const field of ["party_a", "party_b", "price_unit", "a_max_price", "a_latest_deadline", "a_requirements", "action_digest", "state"] as const) {
      expect(verifyCreatedDeal({ ...created, [field]: field === "state" ? "ACTIVE_B_COMMITTED" : "wrong" }, expected)).toBe(false);
    }
  });

  it("requires every accept_participation commitment field and state", () => {
    const value = {
      ...created,
      b_min_price: 100,
      b_earliest_deadline: 1,
      b_requirements: "use the exact secure-email channel",
      state: "ACTIVE_B_COMMITTED",
    };
    const expected = {
      dealId: DEAL,
      partyB: PARTY_B,
      priceUnit: "USD",
      minPrice: 100,
      earliestDeadline: 1,
      requirements: "use the exact secure-email channel",
    };
    expect(verifyActiveBCommitted(value, expected)).toBe(true);
    expect(verifyActiveBCommitted({ ...value, b_min_price: 101 }, expected)).toBe(false);
    expect(verifyActiveBCommitted({ ...value, b_requirements: "injected" }, expected)).toBe(false);
    expect(verifyActiveBCommitted({ ...value, state: "OFFER_SUBMITTED" }, expected)).toBe(false);
  });

  it("requires exact offer fields, canonical terms, digest linkage, and state", () => {
    const value = {
      deal: { deal_id: DEAL, state: "OFFER_SUBMITTED", offer_digest: OFFER },
      offer: {
        deal_id: DEAL,
        price: 500,
        deadline: 2000000000,
        action_digest: ACTION,
        terms_json: TERMS,
        terms: [{ key: "channel", value: "secure-email" }],
        offer_digest: OFFER,
        submitted_by: PARTY_A,
      },
    };
    const expected = {
      dealId: DEAL,
      price: 500,
      deadline: 2000000000,
      actionDigest: ACTION,
      terms: TERMS,
      submittedBy: PARTY_A,
    };
    expect(verifySubmittedOffer(value, expected)).toBe(true);
    expect(verifySubmittedOffer({ ...value, offer: { ...value.offer, price: 501 } }, expected)).toBe(false);
    expect(verifySubmittedOffer({ ...value, offer: { ...value.offer, terms_json: "[]" } }, expected)).toBe(false);
    expect(verifySubmittedOffer({ ...value, deal: { ...value.deal, offer_digest: `0x${"f".repeat(64)}` } }, expected)).toBe(false);
  });
});
