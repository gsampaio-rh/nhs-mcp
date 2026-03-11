import { config } from "../config.js";
import { logger } from "../logger.js";

export interface CkanResponse<T> {
  success: boolean;
  result: T;
}

export interface CkanError {
  success: false;
  error: { message: string; __type: string };
}

export interface CkanResource {
  id: string;
  name: string;
  format: string;
  url: string;
  description: string;
  datastore_active: boolean;
}

export interface CkanPackage {
  id: string;
  name: string;
  title: string;
  notes: string;
  num_resources: number;
  resources: CkanResource[];
  organization: { title: string } | null;
  metadata_modified: string;
}

export interface PackageSearchResult {
  count: number;
  results: CkanPackage[];
}

export interface DatastoreSearchResult {
  records: Record<string, unknown>[];
  total: number;
  fields: Array<{ id: string; type: string }>;
}

export interface NhsbsaClientResult<T> {
  success: true;
  data: T;
}

export interface NhsbsaClientError {
  success: false;
  error: string;
}

export type NhsbsaResult<T> = NhsbsaClientResult<T> | NhsbsaClientError;

export class NhsbsaClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options?: { baseUrl?: string; timeout?: number }) {
    this.baseUrl = options?.baseUrl ?? config.nhsbsa.baseUrl;
    this.timeout = options?.timeout ?? config.nhsbsa.timeout;
  }

  async packageList(): Promise<NhsbsaResult<string[]>> {
    return this.request<string[]>("package_list");
  }

  async packageSearch(
    query?: string,
    rows = 20,
    offset = 0,
  ): Promise<NhsbsaResult<PackageSearchResult>> {
    const params = new URLSearchParams({
      rows: String(rows),
      start: String(offset),
    });
    if (query) {
      params.set("q", query);
    }
    return this.request<PackageSearchResult>(`package_search?${params}`);
  }

  async packageShow(packageId: string): Promise<NhsbsaResult<CkanPackage>> {
    const params = new URLSearchParams({ id: packageId });
    return this.request<CkanPackage>(`package_show?${params}`);
  }

  async datastoreSearch(
    resourceId: string,
    options?: {
      query?: string;
      filters?: Record<string, string>;
      limit?: number;
      offset?: number;
    },
  ): Promise<NhsbsaResult<DatastoreSearchResult>> {
    const params = new URLSearchParams({ resource_id: resourceId });

    if (options?.query) {
      params.set("q", options.query);
    }
    if (options?.filters && Object.keys(options.filters).length > 0) {
      params.set("filters", JSON.stringify(options.filters));
    }
    if (options?.limit !== undefined) {
      params.set("limit", String(options.limit));
    }
    if (options?.offset !== undefined) {
      params.set("offset", String(options.offset));
    }

    return this.request<DatastoreSearchResult>(`datastore_search?${params}`);
  }

  private async request<T>(action: string): Promise<NhsbsaResult<T>> {
    const url = `${this.baseUrl}/${action}`;

    logger.info("NHSBSA API request", { url });

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        logger.error("NHSBSA API error response", {
          url,
          status: response.status,
          body: errorText,
        });

        if (response.status === 404) {
          return { success: false, error: "Resource not found on NHSBSA portal" };
        }
        if (response.status >= 500) {
          return { success: false, error: "NHS BSA service is temporarily unavailable. Try again shortly." };
        }
        return { success: false, error: `NHSBSA API returned status ${response.status}: ${errorText}` };
      }

      const body = (await response.json()) as CkanResponse<T> | CkanError;

      if (!body.success) {
        const ckanError = body as CkanError;
        const message = ckanError.error?.message ?? "Unknown CKAN error";
        logger.error("CKAN action error", { url, message });
        return { success: false, error: message };
      }

      return { success: true, data: (body as CkanResponse<T>).result };
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        logger.error("NHSBSA API timeout", { url, timeout: this.timeout });
        return { success: false, error: `Request to NHSBSA timed out after ${this.timeout / 1000}s` };
      }

      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("NHSBSA API network error", { url, error: message });
      return { success: false, error: `Failed to connect to NHSBSA: ${message}` };
    }
  }
}
