import { describe, it, expect, vi } from "vitest";
import { searchPrescriptions } from "../../../src/application/use-cases/searchPrescriptions.js";
import type { NhsbsaClient } from "../../../src/infrastructure/clients/nhsbsa.js";

function createMockClient(
  datastoreSearch: ReturnType<typeof vi.fn>,
): NhsbsaClient {
  return {
    packageList: vi.fn(),
    packageShow: vi.fn(),
    datastoreSearch,
  } as unknown as NhsbsaClient;
}

const RESOURCE_ID = "EPD_TEST";

describe("searchPrescriptions", () => {
  it("maps BNF code to CKAN filter", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { records: [], total: 0, fields: [] },
    });
    const client = createMockClient(datastoreSearch);

    await searchPrescriptions(client, { bnfCode: "0407010H0" }, RESOURCE_ID);

    expect(datastoreSearch).toHaveBeenCalledWith(
      RESOURCE_ID,
      expect.objectContaining({
        filters: { BNF_CODE: "0407010H0" },
      }),
    );
  });

  it("maps drug name to free-text query", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { records: [], total: 0, fields: [] },
    });
    const client = createMockClient(datastoreSearch);

    await searchPrescriptions(client, { drugName: "Paracetamol" }, RESOURCE_ID);

    expect(datastoreSearch).toHaveBeenCalledWith(
      RESOURCE_ID,
      expect.objectContaining({
        query: "Paracetamol",
      }),
    );
  });

  it("combines multiple filters", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { records: [], total: 0, fields: [] },
    });
    const client = createMockClient(datastoreSearch);

    await searchPrescriptions(
      client,
      { bnfCode: "0407010H0", practiceCode: "A81001", yearMonth: "202401" },
      RESOURCE_ID,
    );

    expect(datastoreSearch).toHaveBeenCalledWith(
      RESOURCE_ID,
      expect.objectContaining({
        filters: {
          BNF_CODE: "0407010H0",
          PRACTICE_CODE: "A81001",
          YEAR_MONTH: "202401",
        },
      }),
    );
  });

  it("respects limit parameter", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { records: [], total: 0, fields: [] },
    });
    const client = createMockClient(datastoreSearch);

    await searchPrescriptions(client, { limit: 50 }, RESOURCE_ID);

    expect(datastoreSearch).toHaveBeenCalledWith(
      RESOURCE_ID,
      expect.objectContaining({ limit: 50 }),
    );
  });

  it("clamps limit to max value", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { records: [], total: 0, fields: [] },
    });
    const client = createMockClient(datastoreSearch);

    await searchPrescriptions(client, { limit: 500 }, RESOURCE_ID);

    expect(datastoreSearch).toHaveBeenCalledWith(
      RESOURCE_ID,
      expect.objectContaining({ limit: 100 }),
    );
  });

  it("maps raw records to PrescriptionRecord shape", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: {
        records: [
          {
            BNF_CODE: "0407010H0",
            BNF_DESCRIPTION: "Paracetamol",
            PRACTICE_CODE: "A81001",
            PRACTICE_NAME: "Test Surgery",
            ITEMS: 150,
            QUANTITY: 3000,
            NIC: 25.5,
            ACTUAL_COST: 23.8,
            YEAR_MONTH: "202401",
          },
        ],
        total: 1,
        fields: [],
      },
    });
    const client = createMockClient(datastoreSearch);

    const result = await searchPrescriptions(client, { bnfCode: "0407010H0" }, RESOURCE_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      const record = result.data.records[0]!;
      expect(record.bnfCode).toBe("0407010H0");
      expect(record.bnfDescription).toBe("Paracetamol");
      expect(record.practiceCode).toBe("A81001");
      expect(record.items).toBe(150);
      expect(record.netIngredientCost).toBe(25.5);
    }
  });

  it("returns error when upstream fails", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: false,
      error: "Resource not found",
    });
    const client = createMockClient(datastoreSearch);

    const result = await searchPrescriptions(client, { bnfCode: "0407010H0" }, RESOURCE_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Resource not found");
    }
  });

  it("returns empty results when no records match", async () => {
    const datastoreSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { records: [], total: 0, fields: [] },
    });
    const client = createMockClient(datastoreSearch);

    const result = await searchPrescriptions(client, { bnfCode: "XXXXXXXXX" }, RESOURCE_ID);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.records).toHaveLength(0);
      expect(result.data.total).toBe(0);
    }
  });
});
