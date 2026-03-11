import type { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import type { QueryResult } from "../types.js";
import { config } from "../../infrastructure/config.js";

export async function queryDataset(
  client: NhsbsaClient,
  resourceId: string,
  options?: {
    filters?: Record<string, string>;
    limit?: number;
    offset?: number;
  },
): Promise<{ success: true; data: QueryResult<Record<string, unknown>> } | { success: false; error: string }> {
  const limit = Math.min(
    options?.limit ?? config.defaults.queryLimit,
    config.defaults.maxQueryLimit,
  );
  const offset = options?.offset ?? 0;

  const result = await client.datastoreSearch(resourceId, {
    filters: options?.filters,
    limit,
    offset,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      records: result.data.records,
      total: result.data.total,
      limit,
      offset,
    },
  };
}
