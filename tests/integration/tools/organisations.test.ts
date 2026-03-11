import { describe, it, expect, vi, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../../src/mcp/server.js";

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

describe("Organisation tools (integration)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function createConnectedClient() {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client({ name: "test-client", version: "1.0.0" });

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    return client;
  }

  it("organisations_search returns formatted results", async () => {
    mockFetchResponse({
      Organisations: [
        {
          Name: "LEEDS TEACHING HOSPITALS",
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
    });

    const client = await createConnectedClient();

    const result = await client.callTool({
      name: "organisations_search",
      arguments: { name: "Leeds" },
    });

    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]!.text;
    expect(text).toContain("RR8");
    expect(text).toContain("LEEDS TEACHING HOSPITALS");
  });

  it("organisations_search returns error when no params provided", async () => {
    const client = await createConnectedClient();

    const result = await client.callTool({
      name: "organisations_search",
      arguments: {},
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]!.text;
    expect(text).toContain("At least one search parameter");
  });

  it("organisations_get returns formatted detail", async () => {
    mockFetchResponse({
      Organisation: {
        Name: "PLATT BRIDGE CLINIC",
        OrgId: { root: "root", assigningAuthorityName: "HSCIC", extension: "RJY12" },
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
            { id: "RO198", uniqueRoleId: 98719, primaryRole: true, Status: "Inactive", Date: [{ Type: "Operational", Start: "1993-04-01" }] },
          ],
        },
      },
    });

    const client = await createConnectedClient();

    const result = await client.callTool({
      name: "organisations_get",
      arguments: { ods_code: "RJY12" },
    });

    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]!.text;
    expect(text).toContain("PLATT BRIDGE CLINIC");
    expect(text).toContain("RJY12");
    expect(text).toContain("WN2 5AH");
  });

  it("organisations_get returns error for missing org", async () => {
    mockFetchResponse({ error: "not found" }, 404);

    const client = await createConnectedClient();

    const result = await client.callTool({
      name: "organisations_get",
      arguments: { ods_code: "INVALID" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]!.text;
    expect(text).toContain("not found");
  });
});
