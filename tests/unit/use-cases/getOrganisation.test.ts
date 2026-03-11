import { describe, it, expect, vi } from "vitest";
import { getOrganisation } from "../../../src/application/use-cases/getOrganisation.js";
import type { OdsClient } from "../../../src/infrastructure/clients/ods.js";

function createMockClient(overrides: Partial<OdsClient> = {}): OdsClient {
  return {
    searchOrganisations: vi.fn(),
    getOrganisation: vi.fn(),
    listRoles: vi.fn(),
    ...overrides,
  } as unknown as OdsClient;
}

describe("getOrganisation", () => {
  it("maps full organisation detail including address", async () => {
    const client = createMockClient({
      getOrganisation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          Name: "PLATT BRIDGE CLINIC",
          OrgId: { root: "2.16.840.1.113883.2.1.3.2.4.18.48", assigningAuthorityName: "HSCIC", extension: "RJY12" },
          Status: "Inactive",
          LastChangeDate: "2013-05-08",
          orgRecordClass: "RC2",
          GeoLoc: {
            Location: {
              AddrLn1: "VICTORIA STREET",
              Town: "WIGAN",
              PostCode: "WN2 5AH",
              Country: "ENGLAND",
            },
          },
          Roles: {
            Role: [
              {
                id: "RO198",
                uniqueRoleId: 98719,
                primaryRole: true,
                Status: "Inactive",
                Date: [{ Type: "Operational", Start: "1993-04-01", End: "2001-03-31" }],
              },
            ],
          },
        },
      }),
    });

    const result = await getOrganisation(client, "RJY12");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orgId).toBe("RJY12");
      expect(result.data.name).toBe("PLATT BRIDGE CLINIC");
      expect(result.data.status).toBe("Inactive");
      expect(result.data.address?.line1).toBe("VICTORIA STREET");
      expect(result.data.address?.postCode).toBe("WN2 5AH");
      expect(result.data.roles).toHaveLength(1);
      expect(result.data.roles[0]!.id).toBe("RO198");
      expect(result.data.roles[0]!.primaryRole).toBe(true);
      expect(result.data.roles[0]!.startDate).toBe("1993-04-01");
      expect(result.data.roles[0]!.endDate).toBe("2001-03-31");
    }
  });

  it("handles organisation with no GeoLoc", async () => {
    const client = createMockClient({
      getOrganisation: vi.fn().mockResolvedValue({
        success: true,
        data: {
          Name: "TEST ORG",
          OrgId: { root: "root", assigningAuthorityName: "AUTH", extension: "TEST1" },
          Status: "Active",
          LastChangeDate: "2024-01-01",
          orgRecordClass: "RC1",
        },
      }),
    });

    const result = await getOrganisation(client, "TEST1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.address).toBeNull();
      expect(result.data.roles).toHaveLength(0);
      expect(result.data.relationships).toHaveLength(0);
      expect(result.data.successors).toHaveLength(0);
    }
  });

  it("maps relationships correctly", async () => {
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
                uniqueRelId: 12345,
                Status: "Active",
                Date: [{ Type: "Operational", Start: "2020-01-01" }],
                Target: {
                  OrgId: { extension: "QWO" },
                  PrimaryRoleId: { id: "RO98", uniqueRoleId: 1 },
                },
              },
            ],
          },
        },
      }),
    });

    const result = await getOrganisation(client, "A81001");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relationships).toHaveLength(1);
      expect(result.data.relationships[0]!.targetOrgId).toBe("QWO");
      expect(result.data.relationships[0]!.id).toBe("RE4");
    }
  });

  it("propagates error from client", async () => {
    const client = createMockClient({
      getOrganisation: vi.fn().mockResolvedValue({
        success: false,
        error: "Organisation not found",
      }),
    });

    const result = await getOrganisation(client, "INVALID");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Organisation not found");
    }
  });
});
