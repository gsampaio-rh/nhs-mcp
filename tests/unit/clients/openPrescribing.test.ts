import { describe, it, expect, vi, afterEach } from "vitest";
import { OpenPrescribingClient } from "../../../src/infrastructure/clients/openPrescribing.js";

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

describe("OpenPrescribingClient", () => {
  const client = new OpenPrescribingClient({
    baseUrl: "https://test.example.com/api/1.0",
    timeout: 5000,
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("spending", () => {
    it("returns spending records on success", async () => {
      const mockData = [
        { date: "2024-01-01", actual_cost: 123.45, items: 100, quantity: 500, row_id: null, row_name: "england" },
        { date: "2024-02-01", actual_cost: 130.00, items: 110, quantity: 550, row_id: null, row_name: "england" },
      ];
      mockFetchResponse(mockData);

      const result = await client.spending({ code: "0407010H0" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]!.actual_cost).toBe(123.45);
        expect(result.data[0]!.items).toBe(100);
      }
    });

    it("sends code and format query params", async () => {
      mockFetchResponse([]);

      await client.spending({ code: "0212" });

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("spending/?");
      expect(calledUrl).toContain("code=0212");
      expect(calledUrl).toContain("format=json");
    });

    it("returns structured error on HTTP 404", async () => {
      mockFetchResponse({ detail: "Not found" }, 404);

      const result = await client.spending({ code: "INVALID" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("returns structured error on HTTP 500", async () => {
      mockFetchResponse({ detail: "Server error" }, 500);

      const result = await client.spending({ code: "0407010H0" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("temporarily unavailable");
      }
    });

    it("returns structured error on network failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

      const result = await client.spending({ code: "0407010H0" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("ECONNREFUSED");
      }
    });

    it("returns structured error on timeout", async () => {
      const timeoutErr = new DOMException("Signal timed out", "TimeoutError");
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr));

      const result = await client.spending({ code: "0407010H0" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("timed out");
      }
    });
  });

  describe("spendingByOrg", () => {
    it("returns spending records by organisation", async () => {
      const mockData = [
        { date: "2024-01-01", actual_cost: 50.00, items: 30, quantity: 200, row_id: "QWO", row_name: "NHS WEST YORKSHIRE ICB" },
      ];
      mockFetchResponse(mockData);

      const result = await client.spendingByOrg({ code: "0407010H0", orgType: "sicbl", org: "QWO" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.row_name).toBe("NHS WEST YORKSHIRE ICB");
      }
    });

    it("sends org_type and optional params", async () => {
      mockFetchResponse([]);

      await client.spendingByOrg({ code: "0212", orgType: "practice", org: "A81001", date: "2024-01-01" });

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).toContain("spending_by_org/?");
      expect(calledUrl).toContain("code=0212");
      expect(calledUrl).toContain("org_type=practice");
      expect(calledUrl).toContain("org=A81001");
      expect(calledUrl).toContain("date=2024-01-01");
    });

    it("omits optional params when not provided", async () => {
      mockFetchResponse([]);

      await client.spendingByOrg({ code: "0212", orgType: "sicbl" });

      const fetchFn = vi.mocked(fetch);
      const calledUrl = fetchFn.mock.calls[0]![0] as string;
      expect(calledUrl).not.toContain("org=");
      expect(calledUrl).not.toContain("date=");
    });
  });
});
