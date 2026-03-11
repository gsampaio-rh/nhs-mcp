import { describe, it, expect, vi } from "vitest";
import { getOrganisationRelationships } from "../../../src/application/use-cases/getOrganisationRelationships.js";
import type { OdsClient } from "../../../src/infrastructure/clients/ods.js";

function createMockClient(overrides: Partial<OdsClient> = {}): OdsClient {
  return {
    searchOrganisations: vi.fn(),
    getOrganisation: vi.fn(),
    listRoles: vi.fn(),
    ...overrides,
  } as unknown as OdsClient;
}

describe("getOrganisationRelationships", () => {
  it("extracts relationships from organisation detail", async () => {
    const client = createMockClient({
      getOrganisation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          Name: "GP PRACTICE",
          OrgId: { root: "root", assigningAuthorityName: "AUTH", extension: "A81001" },
          Status: "Active",
          LastChangeDate: "2024-01-01",
          orgRecordClass: "RC1",
          Rels: {
            Rel: [
              {
                id: "RE4",
                uniqueRelId: 123,
                Status: "Active",
                Date: [{ Type: "Operational", Start: "2020-01-01" }],
                Target: {
                  OrgId: { extension: "QWO" },
                  PrimaryRoleId: { id: "RO98", uniqueRoleId: 1 },
                },
              },
              {
                id: "RE5",
                uniqueRelId: 456,
                Status: "Inactive",
                Date: [{ Type: "Operational", Start: "2015-01-01", End: "2019-12-31" }],
                Target: {
                  OrgId: { extension: "13Y" },
                  PrimaryRoleId: { id: "RO177", uniqueRoleId: 2 },
                },
              },
            ],
          },
        },
      }),
    });

    const result = await getOrganisationRelationships(client, "A81001");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orgId).toBe("A81001");
      expect(result.data.orgName).toBe("GP PRACTICE");
      expect(result.data.relationships).toHaveLength(2);
      expect(result.data.relationships[0]!.relationshipId).toBe("RE4");
      expect(result.data.relationships[0]!.targetOrgId).toBe("QWO");
      expect(result.data.relationships[0]!.status).toBe("Active");
      expect(result.data.relationships[0]!.startDate).toBe("2020-01-01");
      expect(result.data.relationships[0]!.endDate).toBeUndefined();
      expect(result.data.relationships[1]!.endDate).toBe("2019-12-31");
    }
  });

  it("returns empty relationships when org has no Rels", async () => {
    const client = createMockClient({
      getOrganisation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          Name: "STANDALONE ORG",
          OrgId: { root: "root", assigningAuthorityName: "AUTH", extension: "XYZ" },
          Status: "Active",
          LastChangeDate: "2024-01-01",
          orgRecordClass: "RC1",
        },
      }),
    });

    const result = await getOrganisationRelationships(client, "XYZ");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relationships).toHaveLength(0);
    }
  });

  it("propagates client error", async () => {
    const client = createMockClient({
      getOrganisation: vi.fn().mockResolvedValue({
        success: false,
        error: "Organisation not found",
      }),
    });

    const result = await getOrganisationRelationships(client, "INVALID");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Organisation not found");
    }
  });
});
