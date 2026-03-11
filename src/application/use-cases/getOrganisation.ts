import type { OdsClient } from "../../infrastructure/clients/ods.js";
import type { OrganisationDetail } from "../types.js";

export async function getOrganisation(
  client: OdsClient,
  odsCode: string,
): Promise<{ success: true; data: OrganisationDetail } | { success: false; error: string }> {
  const result = await client.getOrganisation(odsCode);

  if (!result.success) return result;

  const org = result.data;
  const location = org.GeoLoc?.Location;

  const roles = (org.Roles?.Role ?? []).map((role) => {
    const operationalDate = role.Date?.find((d) => d.Type === "Operational");
    return {
      id: role.id,
      primaryRole: role.primaryRole,
      status: role.Status,
      startDate: operationalDate?.Start,
      endDate: operationalDate?.End,
    };
  });

  const relationships = (org.Rels?.Rel ?? []).map((rel) => ({
    id: rel.id,
    status: rel.Status,
    targetOrgId: rel.Target.OrgId.extension,
    targetPrimaryRoleId: rel.Target.PrimaryRoleId.id,
  }));

  const successors = (org.Succs?.Succ ?? []).map((succ) => ({
    type: succ.Type,
    targetOrgId: succ.Target.OrgId.extension,
  }));

  return {
    success: true,
    data: {
      orgId: org.OrgId.extension,
      name: org.Name,
      status: org.Status,
      lastChangeDate: org.LastChangeDate,
      recordClass: org.orgRecordClass,
      address: location
        ? {
            line1: location.AddrLn1,
            line2: location.AddrLn2,
            line3: location.AddrLn3,
            town: location.Town,
            county: location.County,
            postCode: location.PostCode,
            country: location.Country,
          }
        : null,
      roles,
      relationships,
      successors,
    },
  };
}
