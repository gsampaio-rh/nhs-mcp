import { describe, it, expect, vi } from "vitest";
import { searchOrganisations } from "../../../src/application/use-cases/searchOrganisations.js";
import type { OdsClient } from "../../../src/infrastructure/clients/ods.js";

function createMockClient(overrides: Partial<OdsClient> = {}): OdsClient {
  return {
    searchOrganisations: vi.fn(),
    getOrganisation: vi.fn(),
    listRoles: vi.fn(),
    ...overrides,
  } as unknown as OdsClient;
}

describe("searchOrganisations", () => {
  it("returns organisation summaries from ODS search", async () => {
    const client = createMockClient({
      searchOrganisations: vi.fn().mockResolvedValue({
        success: true,
        data: [
          {
            Name: "LEEDS TEACHING HOSPITALS NHS TRUST",
            OrgId: "RR8",
            Status: "Active",
            OrgRecordClass: "RC1",
            PostCode: "LS1 3EX",
            LastChangeDate: "2024-01-15",
            PrimaryRoleId: "RO197",
            PrimaryRoleDescription: "NHS TRUST",
            OrgLink: "https://example.com/organisations/RR8",
          },
        ],
      }),
    });

    const result = await searchOrganisations(client, { name: "Leeds" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.orgId).toBe("RR8");
      expect(result.data[0]!.name).toBe("LEEDS TEACHING HOSPITALS NHS TRUST");
      expect(result.data[0]!.primaryRoleDescription).toBe("NHS TRUST");
    }
  });

  it("requires at least one search parameter", async () => {
    const client = createMockClient();

    const result = await searchOrganisations(client, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("At least one search parameter");
    }
  });

  it("passes role as primaryRoleId to client", async () => {
    const searchFn = vi.fn().mockResolvedValue({ success: true, data: [] });
    const client = createMockClient({ searchOrganisations: searchFn });

    await searchOrganisations(client, { role: "RO76" });

    expect(searchFn).toHaveBeenCalledWith(
      expect.objectContaining({ primaryRoleId: "RO76" }),
    );
  });

  it("propagates error from client", async () => {
    const client = createMockClient({
      searchOrganisations: vi.fn().mockResolvedValue({
        success: false,
        error: "Service unavailable",
      }),
    });

    const result = await searchOrganisations(client, { name: "Test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Service unavailable");
    }
  });

  it("defaults limit to 20", async () => {
    const searchFn = vi.fn().mockResolvedValue({ success: true, data: [] });
    const client = createMockClient({ searchOrganisations: searchFn });

    await searchOrganisations(client, { name: "Test" });

    expect(searchFn).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    );
  });

  it("returns empty array when no organisations match", async () => {
    const client = createMockClient({
      searchOrganisations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    const result = await searchOrganisations(client, { postCode: "ZZ99" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });
});
