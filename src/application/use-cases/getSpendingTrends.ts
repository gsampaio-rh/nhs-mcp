import type { OpenPrescribingClient } from "../../infrastructure/clients/openPrescribing.js";
import type { SpendingTrendResult } from "../types.js";

interface SpendingTrendsParams {
  bnfCode: string;
  orgType?: "sicbl" | "practice";
  org?: string;
}

export async function getSpendingTrends(
  client: OpenPrescribingClient,
  params: SpendingTrendsParams,
): Promise<{ success: true; data: SpendingTrendResult } | { success: false; error: string }> {
  const result = params.orgType
    ? await client.spendingByOrg({
        code: params.bnfCode,
        orgType: params.orgType,
        org: params.org,
      })
    : await client.spending({ code: params.bnfCode });

  if (!result.success) return result;

  if (result.data.length === 0) {
    return { success: false, error: `No spending data found for BNF code '${params.bnfCode}'.` };
  }

  const orgName = result.data[0]?.row_name ?? null;

  return {
    success: true,
    data: {
      bnfCode: params.bnfCode,
      orgName: orgName === "england" ? "England (national)" : orgName,
      data: result.data.map((r) => ({
        date: r.date,
        actualCost: r.actual_cost,
        items: r.items,
        quantity: r.quantity,
      })),
    },
  };
}
