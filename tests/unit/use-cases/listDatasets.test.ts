import { describe, it, expect, vi } from "vitest";
import { listDatasets, getDatasetMetadata } from "../../../src/application/use-cases/listDatasets.js";
import type { NhsbsaClient } from "../../../src/infrastructure/clients/nhsbsa.js";

function createMockClient(overrides: Partial<NhsbsaClient> = {}): NhsbsaClient {
  return {
    packageList: vi.fn(),
    packageSearch: vi.fn(),
    packageShow: vi.fn(),
    datastoreSearch: vi.fn(),
    ...overrides,
  } as unknown as NhsbsaClient;
}

describe("listDatasets", () => {
  it("returns dataset summaries from packageSearch", async () => {
    const client = createMockClient({
      packageSearch: vi.fn().mockResolvedValue({
        success: true,
        data: {
          count: 2,
          results: [
            { id: "1", name: "dataset-a", title: "Dataset A", notes: "First dataset", num_resources: 3, resources: [] },
            { id: "2", name: "dataset-b", title: "Dataset B", notes: "Second dataset", num_resources: 1, resources: [] },
          ],
        },
      }),
    });

    const result = await listDatasets(client);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]!.title).toBe("Dataset A");
      expect(result.data[1]!.title).toBe("Dataset B");
    }
  });

  it("passes search query to packageSearch", async () => {
    const packageSearch = vi.fn().mockResolvedValue({
      success: true,
      data: {
        count: 1,
        results: [
          { id: "1", name: "prescribing", title: "Prescribing Data", notes: "GP prescribing", num_resources: 2, resources: [] },
        ],
      },
    });
    const client = createMockClient({ packageSearch });

    const result = await listDatasets(client, "prescribing");

    expect(packageSearch).toHaveBeenCalledWith("prescribing", 20);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.title).toBe("Prescribing Data");
    }
  });

  it("returns empty array when no datasets match", async () => {
    const client = createMockClient({
      packageSearch: vi.fn().mockResolvedValue({
        success: true,
        data: { count: 0, results: [] },
      }),
    });

    const result = await listDatasets(client, "nonexistent");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it("propagates error when packageSearch fails", async () => {
    const client = createMockClient({
      packageSearch: vi.fn().mockResolvedValue({
        success: false,
        error: "Service unavailable",
      }),
    });

    const result = await listDatasets(client);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Service unavailable");
    }
  });

  it("respects custom limit", async () => {
    const packageSearch = vi.fn().mockResolvedValue({
      success: true,
      data: { count: 0, results: [] },
    });
    const client = createMockClient({ packageSearch });

    await listDatasets(client, undefined, 50);

    expect(packageSearch).toHaveBeenCalledWith(undefined, 50);
  });
});

describe("getDatasetMetadata", () => {
  it("returns full metadata with resources", async () => {
    const client = createMockClient({
      packageShow: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: "abc",
          name: "test",
          title: "Test Dataset",
          notes: "Notes here",
          organization: { title: "NHSBSA" },
          metadata_modified: "2024-06-01",
          resources: [
            {
              id: "res-1",
              name: "Jan 2024",
              format: "CSV",
              description: "January data",
              datastore_active: true,
            },
          ],
        },
      }),
    });

    const result = await getDatasetMetadata(client, "test");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test Dataset");
      expect(result.data.organization).toBe("NHSBSA");
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0]!.id).toBe("res-1");
      expect(result.data.resources[0]!.datastoreActive).toBe(true);
    }
  });

  it("propagates error when packageShow fails", async () => {
    const client = createMockClient({
      packageShow: vi.fn().mockResolvedValue({
        success: false,
        error: "Dataset not found",
      }),
    });

    const result = await getDatasetMetadata(client, "nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Dataset not found");
    }
  });
});
