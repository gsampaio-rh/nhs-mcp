import { describe, it, expect, vi, afterEach } from "vitest";
import { OdsClient } from "../../../src/infrastructure/clients/ods.js";

function mockFetchResponse(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    }),
  );
}

describe("OdsClient", () => {
  const client = new OdsClient({
    baseUrl: "https://test.example.com/ORD/2-0-0",
    timeout: 5000,
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchOrganisations", () => {
    it("returns organisations on success", async () => {
      mockFetchResponse({
        Organisations: [
          {
            Name: "LEEDS GENERAL INFIRMARY",
            OrgId: "RR8",
            Status: "Active",
            OrgRecordClass: "RC1",
            PostCode: "LS1 3EX",
            LastChangeDate: "2024-01-15",
            PrimaryRoleId: "RO197",
            PrimaryRoleDescription: "NHS TRUST",
            OrgLink: "https://example.com/ORD/2-0-0/organisations/RR8",
          },
        ],
      });

      const result = await client.searchOrganisations({ name: "Leeds" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.OrgId).toBe("RR8");
        expect(result.data[0]!.Name).toBe("LEEDS GENERAL INFIRMARY");
      }
    });

    it("sends query parameters correctly", async () => {
      mockFetchResponse({ Organisations: [] });

      await client.searchOrganisations({
        name: "Boots",
        primaryRoleId: "RO182",
        status: "Active",
        limit: 10,
        offset: 5,
      });

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("Name=Boots");
      expect(calledUrl).toContain("PrimaryRoleId=RO182");
      expect(calledUrl).toContain("Status=Active");
      expect(calledUrl).toContain("Limit=10");
      expect(calledUrl).toContain("Offset=5");
    });

    it("returns empty array when no organisations found", async () => {
      mockFetchResponse({ Organisations: [] });

      const result = await client.searchOrganisations({ name: "Nonexistent" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("handles missing Organisations key", async () => {
      mockFetchResponse({});

      const result = await client.searchOrganisations({ name: "Test" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("returns structured error on HTTP 404", async () => {
      mockFetchResponse({ error: "not found" }, 404);

      const result = await client.searchOrganisations({ name: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("returns structured error on HTTP 500", async () => {
      mockFetchResponse({ error: "internal error" }, 500);

      const result = await client.searchOrganisations({ name: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("temporarily unavailable");
      }
    });

    it("returns structured error on network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      const result = await client.searchOrganisations({ name: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("ECONNREFUSED");
      }
    });

    it("returns structured error on timeout", async () => {
      const timeoutErr = new DOMException("Signal timed out", "TimeoutError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr));

      const result = await client.searchOrganisations({ name: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("timed out");
      }
    });
  });

  describe("getOrganisation", () => {
    it("returns organisation details on success", async () => {
      mockFetchResponse({
        Organisation: {
          Name: "PLATT BRIDGE CLINIC",
          OrgId: { root: "2.16.840.1.113883.2.1.3.2.4.18.48", assigningAuthorityName: "HSCIC", extension: "RJY12" },
          Status: "Inactive",
          LastChangeDate: "2013-05-08",
          orgRecordClass: "RC2",
          GeoLoc: {
            Location: {
              AddrLn1: "VICTORIA STREET",
              AddrLn2: "PLATT BRIDGE",
              Town: "WIGAN",
              County: "LANCASHIRE",
              PostCode: "WN2 5AH",
              Country: "ENGLAND",
            },
          },
          Roles: {
            Role: [
              { id: "RO198", uniqueRoleId: 98719, primaryRole: true, Status: "Inactive", Date: [{ Type: "Operational", Start: "1993-04-01", End: "2001-03-31" }] },
            ],
          },
        },
      });

      const result = await client.getOrganisation("RJY12");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Name).toBe("PLATT BRIDGE CLINIC");
        expect(result.data.OrgId.extension).toBe("RJY12");
        expect(result.data.GeoLoc?.Location.PostCode).toBe("WN2 5AH");
      }
    });

    it("encodes ODS code in URL", async () => {
      mockFetchResponse({ Organisation: { Name: "Test", OrgId: { extension: "A81001" }, Status: "Active", LastChangeDate: "2024-01-01", orgRecordClass: "RC1" } });

      await client.getOrganisation("A81001");

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("organisations/A81001");
    });

    it("returns structured error on HTTP 404", async () => {
      mockFetchResponse({ error: "not found" }, 404);

      const result = await client.getOrganisation("INVALID");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("listRoles", () => {
    it("returns roles on success", async () => {
      mockFetchResponse({
        Roles: [
          { id: "RO197", code: "197", displayName: "NHS TRUST", primaryRole: "true" },
          { id: "RO198", code: "198", displayName: "NHS TRUST SITE", primaryRole: "true" },
        ],
      });

      const result = await client.listRoles();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]!.id).toBe("RO197");
        expect(result.data[0]!.displayName).toBe("NHS TRUST");
      }
    });

    it("returns empty array when no roles found", async () => {
      mockFetchResponse({ Roles: [] });

      const result = await client.listRoles();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
