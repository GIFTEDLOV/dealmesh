import { stableJson } from "./lifecycle.js";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function sameText(actual: unknown, expected: string): boolean {
  return typeof actual === "string" && actual === expected;
}

function sameAddress(actual: unknown, expected: string): boolean {
  return typeof actual === "string" && actual.toLowerCase() === expected.toLowerCase();
}

function sameInteger(actual: unknown, expected: string | number | bigint): boolean {
  if (typeof actual !== "number" && typeof actual !== "string" && typeof actual !== "bigint") {
    return false;
  }
  return String(actual) === String(expected);
}

function nonEmptyText(actual: unknown): actual is string {
  return typeof actual === "string" && actual.length > 0;
}

export interface CreatedDealExpectation {
  readonly dealId?: string;
  readonly partyA: string;
  readonly partyB: string;
  readonly priceUnit: string;
  readonly maxPrice: string | number | bigint;
  readonly latestDeadline: string | number | bigint;
  readonly requirements: string;
  readonly actionDigest: string;
}

export function verifyCreatedDeal(value: unknown, expected: CreatedDealExpectation): boolean {
  const deal = record(value);
  return deal !== undefined
    && nonEmptyText(deal.deal_id)
    && (expected.dealId === undefined || sameText(deal.deal_id, expected.dealId))
    && sameAddress(deal.party_a, expected.partyA)
    && sameAddress(deal.party_b, expected.partyB)
    && sameText(deal.price_unit, expected.priceUnit)
    && sameInteger(deal.a_max_price, expected.maxPrice)
    && sameInteger(deal.a_latest_deadline, expected.latestDeadline)
    && sameText(deal.a_requirements, expected.requirements)
    && sameText(deal.action_digest, expected.actionDigest)
    && sameText(deal.state, "CREATED_A_COMMITTED");
}

export interface AcceptedDealExpectation {
  readonly dealId: string;
  readonly partyB: string;
  readonly priceUnit: string;
  readonly minPrice: string | number | bigint;
  readonly earliestDeadline: string | number | bigint;
  readonly requirements: string;
}

export function verifyActiveBCommitted(value: unknown, expected: AcceptedDealExpectation): boolean {
  const deal = record(value);
  return deal !== undefined
    && sameText(deal.deal_id, expected.dealId)
    && sameAddress(deal.party_b, expected.partyB)
    && sameText(deal.price_unit, expected.priceUnit)
    && sameInteger(deal.b_min_price, expected.minPrice)
    && sameInteger(deal.b_earliest_deadline, expected.earliestDeadline)
    && sameText(deal.b_requirements, expected.requirements)
    && sameText(deal.state, "ACTIVE_B_COMMITTED");
}

export interface SubmittedOfferExpectation {
  readonly dealId: string;
  readonly price: string | number | bigint;
  readonly deadline: string | number | bigint;
  readonly actionDigest: string;
  readonly terms: string;
  readonly submittedBy?: string;
}

export function canonicalTerms(value: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return undefined;
    return stableJson(parsed);
  } catch {
    return undefined;
  }
}

export function verifySubmittedOffer(value: unknown, expected: SubmittedOfferExpectation): boolean {
  const result = record(value);
  const deal = result ? record(result.deal) : undefined;
  const offer = result ? record(result.offer) : undefined;
  const canonical = canonicalTerms(expected.terms);
  return deal !== undefined
    && offer !== undefined
    && canonical !== undefined
    && sameText(deal.deal_id, expected.dealId)
    && sameText(deal.state, "OFFER_SUBMITTED")
    && nonEmptyText(deal.offer_digest)
    && sameText(offer.deal_id, expected.dealId)
    && sameInteger(offer.price, expected.price)
    && sameInteger(offer.deadline, expected.deadline)
    && sameText(offer.action_digest, expected.actionDigest)
    && sameText(offer.terms_json, canonical)
    && stableJson(offer.terms) === canonical
    && sameText(offer.offer_digest, deal.offer_digest)
    && (expected.submittedBy === undefined || sameAddress(offer.submitted_by, expected.submittedBy));
}
