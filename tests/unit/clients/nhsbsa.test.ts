import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NhsbsaClient } from "../../../src/infrastructure/clients/nhsbsa.js";

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

describe("NhsbsaClient", () => {
  const client = new NhsbsaClient({
    baseUrl: "https://test.example.com/api/3/action",
    timeout: 5000,
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("packageList", () => {
    it("returns list of dataset names on success", async () => {
      mockFetchResponse({
        success: true,
        result: ["dataset-a", "dataset-b", "dataset-c"],
      });

      const result = await client.packageList();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(["dataset-a", "dataset-b", "dataset-c"]);
      }
    });

    it("returns structured error when CKAN reports failure", async () => {
      mockFetchResponse({
        success: false,
        error: { message: "Not authorized", __type: "Authorization Error" },
      });

      const result = await client.packageList();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Not authorized");
      }
    });

    it("returns structured error on HTTP 404", async () => {
      mockFetchResponse({ error: "not found" }, 404);

      const result = await client.packageList();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("returns structured error on HTTP 500", async () => {
      mockFetchResponse({ error: "internal error" }, 500);

      const result = await client.packageList();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("temporarily unavailable");
      }
    });

    it("returns structured error on network failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      );

      const result = await client.packageList();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("ECONNREFUSED");
      }
    });

    it("returns structured error on timeout", async () => {
      const timeoutErr = new DOMException("Signal timed out", "TimeoutError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr));

      const result = await client.packageList();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("timed out");
      }
    });
  });

  describe("packageSearch", () => {
    it("returns search results on success", async () => {
      mockFetchResponse({
        success: true,
        result: {
          count: 2,
          results: [
            { id: "1", name: "ds-a", title: "Dataset A", notes: "", num_resources: 1, resources: [] },
            { id: "2", name: "ds-b", title: "Dataset B", notes: "", num_resources: 2, resources: [] },
          ],
        },
      });

      const result = await client.packageSearch("prescribing", 10);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(2);
        expect(result.data.results).toHaveLength(2);
      }
    });

    it("sends query and rows as params", async () => {
      mockFetchResponse({ success: true, result: { count: 0, results: [] } });

      await client.packageSearch("dental", 5, 10);

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("package_search");
      expect(calledUrl).toContain("q=dental");
      expect(calledUrl).toContain("rows=5");
      expect(calledUrl).toContain("start=10");
    });

    it("omits query param when not provided", async () => {
      mockFetchResponse({ success: true, result: { count: 0, results: [] } });

      await client.packageSearch();

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("package_search");
      expect(calledUrl).not.toContain("q=");
    });
  });

  describe("packageShow", () => {
    it("returns package metadata on success", async () => {
      const pkg = {
        id: "abc-123",
        name: "test-dataset",
        title: "Test Dataset",
        notes: "Some notes",
        num_resources: 2,
        resources: [],
        organization: { title: "NHSBSA" },
        metadata_modified: "2024-01-15",
      };
      mockFetchResponse({ success: true, result: pkg });

      const result = await client.packageShow("test-dataset");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Dataset");
        expect(result.data.id).toBe("abc-123");
      }
    });

    it("sends the package ID as a query parameter", async () => {
      mockFetchResponse({ success: true, result: {} });

      await client.packageShow("my-dataset");

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("package_show?id=my-dataset");
    });
  });

  describe("datastoreSearch", () => {
    it("returns search results on success", async () => {
      const searchResult = {
        records: [{ BNF_CODE: "0407010H0", ITEMS: 100 }],
        total: 1,
        fields: [
          { id: "BNF_CODE", type: "text" },
          { id: "ITEMS", type: "int" },
        ],
      };
      mockFetchResponse({ success: true, result: searchResult });

      const result = await client.datastoreSearch("resource-123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.records).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("builds URL with filters as JSON", async () => {
      mockFetchResponse({ success: true, result: { records: [], total: 0, fields: [] } });

      await client.datastoreSearch("res-1", {
        filters: { BNF_CODE: "0407010H0" },
        limit: 10,
        offset: 5,
      });

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("resource_id=res-1");
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("offset=5");
      expect(calledUrl).toContain("filters=");
      expect(calledUrl).toContain("0407010H0");
    });

    it("builds URL with free-text query", async () => {
      mockFetchResponse({ success: true, result: { records: [], total: 0, fields: [] } });

      await client.datastoreSearch("res-1", { query: "paracetamol" });

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("q=paracetamol");
    });

    it("omits optional params when not provided", async () => {
      mockFetchResponse({ success: true, result: { records: [], total: 0, fields: [] } });

      await client.datastoreSearch("res-1");

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("resource_id=res-1");
      expect(calledUrl).not.toContain("q=");
      expect(calledUrl).not.toContain("filters=");
      expect(calledUrl).not.toContain("limit=");
      expect(calledUrl).not.toContain("offset=");
    });
  });
});
