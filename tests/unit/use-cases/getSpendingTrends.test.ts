import { describe, it, expect, vi } from "vitest";
import { getSpendingTrends } from "../../../src/application/use-cases/getSpendingTrends.js";
import type { OpenPrescribingClient } from "../../../src/infrastructure/clients/openPrescribing.js";

function createMockClient(overrides: Partial<OpenPrescribingClient> = {}): OpenPrescribingClient {
  return {
    spending: vi.fn(),
    spendingByOrg: vi.fn(),
    ...overrides,
  } as unknown as OpenPrescribingClient;
}

describe("getSpendingTrends", () => {
  it("returns national spending data when no orgType provided", async () => {
    const client = createMockClient({
      spending: vi.fn().mockResolvedValue({
        success: true,
        data: [
          { date: "2024-01-01", actual_cost: 100, items: 50, quantity: 300, row_id: null, row_name: "england" },
          { date: "2024-02-01", actual_cost: 110, items: 55, quantity: 320, row_id: null, row_name: "england" },
        ],
      }),
    });

    const result = await getSpendingTrends(client, { bnfCode: "0407010H0" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bnfCode).toBe("0407010H0");
      expect(result.data.orgName).toBe("England (national)");
      expect(result.data.data).toHaveLength(2);
      expect(result.data.data[0]!.actualCost).toBe(100);
      expect(result.data.data[0]!.items).toBe(50);
    }

    expect(client.spending).toHaveBeenCalledWith({ code: "0407010H0" });
    expect(client.spendingByOrg).not.toHaveBeenCalled();
  });

  it("returns org-level spending data when orgType provided", async () => {
    const client = createMockClient({
      spendingByOrg: vi.fn().mockResolvedValue({
        success: true,
        data: [
          { date: "2024-01-01", actual_cost: 40, items: 20, quantity: 100, row_id: "QWO", row_name: "NHS WEST YORKSHIRE ICB" },
        ],
      }),
    });

    const result = await getSpendingTrends(client, { bnfCode: "0212", orgType: "sicbl", org: "QWO" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orgName).toBe("NHS WEST YORKSHIRE ICB");
      expect(result.data.data).toHaveLength(1);
    }

    expect(client.spendingByOrg).toHaveBeenCalledWith({ code: "0212", orgType: "sicbl", org: "QWO" });
  });

  it("returns error when no data found", async () => {
    const client = createMockClient({
      spending: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    const result = await getSpendingTrends(client, { bnfCode: "INVALID" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No spending data found");
      expect(result.error).toContain("INVALID");
    }
  });

  it("propagates client error", async () => {
    const client = createMockClient({
      spending: vi.fn().mockResolvedValue({ success: false, error: "API unavailable" }),
    });

    const result = await getSpendingTrends(client, { bnfCode: "0407010H0" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("API unavailable");
    }
  });
});
