import type { OdsClient } from "../../infrastructure/clients/ods.js";

export interface OrganisationRelationship {
  relationshipId: string;
  status: string;
  targetOrgId: string;
  targetPrimaryRoleId: string;
  startDate?: string;
  endDate?: string;
}

export async function getOrganisationRelationships(
  client: OdsClient,
  odsCode: string,
): Promise<{ success: true; data: { orgId: string; orgName: string; relationships: OrganisationRelationship[] } } | { success: false; error: string }> {
  const result = await client.getOrganisation(odsCode);

  if (!result.success) return result;

  const org = result.data;
  const relationships: OrganisationRelationship[] = (org.Rels?.Rel ?? []).map((rel) => {
    const operationalDate = rel.Date?.find((d) => d.Type === "Operational");
    return {
      relationshipId: rel.id,
      status: rel.Status,
      targetOrgId: rel.Target.OrgId.extension,
      targetPrimaryRoleId: rel.Target.PrimaryRoleId.id,
      startDate: operationalDate?.Start,
      endDate: operationalDate?.End,
    };
  });

  return {
    success: true,
    data: {
      orgId: org.OrgId.extension,
      orgName: org.Name,
      relationships,
    },
  };
}
