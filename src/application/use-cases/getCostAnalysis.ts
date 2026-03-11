import type { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import type { CostAnalysisRecord, QueryResult } from "../types.js";
import { config } from "../../infrastructure/config.js";

interface CostAnalysisParams {
  bnfCode?: string;
  bnfName?: string;
  yearMonth?: string;
  limit?: number;
  offset?: number;
}

const PCA_DATASET_NAME = "prescription-cost-analysis-pca-";

function mapRecord(raw: Record<string, unknown>): CostAnalysisRecord {
  return {
    bnfCode: String(raw["BNF_CODE"] ?? raw["bnf_code"] ?? raw["BNF_CHEMICAL_SUBSTANCE"] ?? ""),
    bnfDescription: String(raw["BNF_DESCRIPTION"] ?? raw["bnf_description"] ?? raw["BNF_CHEMICAL_SUBSTANCE_DESC"] ?? ""),
    items: Number(raw["ITEMS"] ?? raw["items"] ?? raw["TOTAL_ITEMS"] ?? 0),
    quantity: Number(raw["QUANTITY"] ?? raw["quantity"] ?? raw["TOTAL_QUANTITY"] ?? 0),
    netIngredientCost: Number(raw["NIC"] ?? raw["nic"] ?? raw["NET_INGREDIENT_COST"] ?? raw["NIC_£"] ?? 0),
    actualCost: Number(raw["ACTUAL_COST"] ?? raw["actual_cost"] ?? raw["ACTUAL_COST_£"] ?? 0),
    yearMonth: String(raw["YEAR_MONTH"] ?? raw["year_month"] ?? ""),
  };
}

async function findPcaResourceId(
  client: NhsbsaClient,
  yearMonth?: string,
): Promise<{ success: true; resourceId: string } | { success: false; error: string }> {
  const searchResult = await client.packageSearch(PCA_DATASET_NAME, 5);
  if (!searchResult.success) return searchResult;

  const pcaPackage = searchResult.data.results[0];
  if (!pcaPackage) {
    return { success: false, error: "Prescription Cost Analysis dataset not found on NHSBSA portal." };
  }

  const datastoreResources = pcaPackage.resources.filter((r) => r.datastore_active);
  if (datastoreResources.length === 0) {
    return { success: false, error: "No queryable resources found for PCA dataset." };
  }

  if (yearMonth) {
    const match = datastoreResources.find((r) =>
      r.name.includes(yearMonth) || r.id.includes(yearMonth),
    );
    if (match) return { success: true, resourceId: match.id };
  }

  return { success: true, resourceId: datastoreResources[0]!.id };
}

export async function getCostAnalysis(
  client: NhsbsaClient,
  params: CostAnalysisParams,
  resourceId?: string,
): Promise<{ success: true; data: QueryResult<CostAnalysisRecord> } | { success: false; error: string }> {
  let targetResourceId = resourceId;

  if (!targetResourceId) {
    const lookup = await findPcaResourceId(client, params.yearMonth);
    if (!lookup.success) return lookup;
    targetResourceId = lookup.resourceId;
  }

  const limit = Math.min(params.limit ?? config.defaults.queryLimit, config.defaults.maxQueryLimit);
  const offset = params.offset ?? 0;

  const filters: Record<string, string> = {};
  if (params.bnfCode) filters["BNF_CODE"] = params.bnfCode;
  if (params.yearMonth) filters["YEAR_MONTH"] = params.yearMonth;

  const result = await client.datastoreSearch(targetResourceId, {
    query: params.bnfName,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    limit,
    offset,
  });

  if (!result.success) return result;

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
