import { describe, expect, it, vi } from "vitest";
import { createdDealExpectation } from "../src/App.js";

const PARTY_A = `0x${"1".repeat(40)}`;
const PARTY_B = `0x${"2".repeat(40)}`;
const DEAL = `0x${"d".repeat(64)}`;

describe("create_deal recovery context", () => {
  it("looks up the finalized deal for authenticated Party A, never Party B", async () => {
    const read = vi.fn(async (method: string, args: readonly unknown[]) => {
      if (method === "get_latest_deal_for") return DEAL;
      return JSON.stringify({
        deal_id: DEAL,
        party_a: PARTY_A,
        party_b: PARTY_B,
        price_unit: "USD",
        a_max_price: 1000,
        a_latest_deadline: 4102444800,
        a_requirements: "use the exact secure-email channel",
        action_digest: `0x${"a".repeat(64)}`,
        state: "CREATED_A_COMMITTED",
      });
    });
    const expectation = createdDealExpectation({ read } as never, PARTY_A, {
      partyA: PARTY_A,
      partyB: PARTY_B,
      priceUnit: "USD",
      maxPrice: 1000,
      latestDeadline: 4102444800,
      requirements: "use the exact secure-email channel",
      actionDigest: `0x${"a".repeat(64)}`,
    });
    const value = await expectation.read();
    expect(read).toHaveBeenNthCalledWith(1, "get_latest_deal_for", [PARTY_A], true);
    expect(read).not.toHaveBeenCalledWith("get_deal", [PARTY_B], true);
    expect(expectation.verify?.(value)).toBe(true);
  });
});
