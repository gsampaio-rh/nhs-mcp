import type { NhsbsaClient } from "../../infrastructure/clients/nhsbsa.js";
import type { CkanPackage } from "../../infrastructure/clients/nhsbsa.js";
import type { DatasetSummary, DatasetMetadata } from "../types.js";

function toSummary(pkg: CkanPackage): DatasetSummary {
  return {
    id: pkg.id,
    name: pkg.name,
    title: pkg.title,
    notes: pkg.notes ?? "",
    numResources: pkg.num_resources,
  };
}

export async function listDatasets(
  client: NhsbsaClient,
  searchQuery?: string,
  limit = 20,
): Promise<{ success: true; data: DatasetSummary[] } | { success: false; error: string }> {
  const result = await client.packageSearch(searchQuery, limit);
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: result.data.results.map(toSummary),
  };
}

export async function getDatasetMetadata(
  client: NhsbsaClient,
  datasetId: string,
): Promise<{ success: true; data: DatasetMetadata } | { success: false; error: string }> {
  const result = await client.packageShow(datasetId);
  if (!result.success) {
    return result;
  }

  const pkg = result.data;
  return {
    success: true,
    data: {
      id: pkg.id,
      name: pkg.name,
      title: pkg.title,
      notes: pkg.notes ?? "",
      organization: pkg.organization?.title ?? null,
      metadataModified: pkg.metadata_modified,
      resources: pkg.resources.map((r) => ({
        id: r.id,
        name: r.name,
        format: r.format,
        description: r.description ?? "",
        datastoreActive: r.datastore_active,
      })),
    },
  };
}
