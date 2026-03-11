import type { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import type { PrescriptionRecord, QueryResult } from "../types.js";
import { config } from "../../infrastructure/config.js";

interface SearchPrescriptionsParams {
  bnfCode?: string;
  drugName?: string;
  practiceCode?: string;
  yearMonth?: string;
  limit?: number;
  offset?: number;
}

function buildFilters(params: SearchPrescriptionsParams): Record<string, string> {
  const filters: Record<string, string> = {};

  if (params.bnfCode) filters["BNF_CODE"] = params.bnfCode;
  if (params.practiceCode) filters["PRACTICE_CODE"] = params.practiceCode;
  if (params.yearMonth) filters["YEAR_MONTH"] = params.yearMonth;

  return filters;
}

function mapRecord(raw: Record<string, unknown>): PrescriptionRecord {
  return {
    bnfCode: String(raw["BNF_CODE"] ?? raw["bnf_code"] ?? ""),
    bnfDescription: String(raw["BNF_DESCRIPTION"] ?? raw["bnf_description"] ?? ""),
    practiceCode: String(raw["PRACTICE_CODE"] ?? raw["practice_code"] ?? ""),
    practiceName: String(raw["PRACTICE_NAME"] ?? raw["practice_name"] ?? ""),
    items: Number(raw["ITEMS"] ?? raw["items"] ?? 0),
    quantity: Number(raw["QUANTITY"] ?? raw["quantity"] ?? 0),
    netIngredientCost: Number(raw["NIC"] ?? raw["nic"] ?? raw["NET_INGREDIENT_COST"] ?? 0),
    actualCost: Number(raw["ACTUAL_COST"] ?? raw["actual_cost"] ?? 0),
    yearMonth: String(raw["YEAR_MONTH"] ?? raw["year_month"] ?? ""),
  };
}

export async function searchPrescriptions(
  client: NhsbsaClient,
  params: SearchPrescriptionsParams,
  resourceId: string,
): Promise<{ success: true; data: QueryResult<PrescriptionRecord> } | { success: false; error: string }> {
  const limit = Math.min(
    params.limit ?? config.defaults.queryLimit,
    config.defaults.maxQueryLimit,
  );
  const offset = params.offset ?? 0;
  const filters = buildFilters(params);

  const result = await client.datastoreSearch(resourceId, {
    query: params.drugName,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    limit,
    offset,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      records: result.data.records.map(mapRecord),
      total: result.data.total,
      limit,
      offset,
    },
  };
}
