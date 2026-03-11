import type { OdsClient } from "../../infrastructure/clients/ods.js";
import type { OrganisationSummary } from "../types.js";

interface SearchOrganisationsParams {
  name?: string;
  role?: string;
  postCode?: string;
  status?: "Active" | "Inactive";
  limit?: number;
  offset?: number;
}

export async function searchOrganisations(
  client: OdsClient,
  params: SearchOrganisationsParams,
): Promise<{ success: true; data: OrganisationSummary[] } | { success: false; error: string }> {
  if (!params.name && !params.role && !params.postCode) {
    return { success: false, error: "At least one search parameter (name, role, or postCode) is required." };
  }

  const result = await client.searchOrganisations({
    name: params.name,
    primaryRoleId: params.role,
    postCode: params.postCode,
    status: params.status,
    limit: params.limit ?? 20,
    offset: params.offset,
  });

  if (!result.success) return result;

  const organisations: OrganisationSummary[] = result.data.map((org) => ({
    orgId: org.OrgId,
    name: org.Name,
    status: org.Status,
    postCode: org.PostCode ?? "",
    lastChangeDate: org.LastChangeDate,
    primaryRoleId: org.PrimaryRoleId,
    primaryRoleDescription: org.PrimaryRoleDescription,
  }));

  return { success: true, data: organisations };
}
