import { config } from "../config.js";
import { logger } from "../logger.js";

export interface OdsOrganisationSummary {
  Name: string;
  OrgId: string;
  Status: string;
  OrgRecordClass: string;
  PostCode: string;
  LastChangeDate: string;
  PrimaryRoleId: string;
  PrimaryRoleDescription: string;
  OrgLink: string;
}

export interface OdsOrganisationDetail {
  Name: string;
  OrgId: { root: string; assigningAuthorityName: string; extension: string };
  Status: string;
  LastChangeDate: string;
  orgRecordClass: string;
  GeoLoc?: {
    Location: {
      AddrLn1?: string;
      AddrLn2?: string;
      AddrLn3?: string;
      Town?: string;
      County?: string;
      PostCode?: string;
      Country?: string;
    };
  };
  Roles?: {
    Role: Array<{
      id: string;
      uniqueRoleId: number;
      primaryRole: boolean;
      Status: string;
      Date?: Array<{ Type: string; Start: string; End?: string }>;
    }>;
  };
  Rels?: {
    Rel: Array<{
      Date: Array<{ Type: string; Start: string; End?: string }>;
      Status: string;
      Target: { OrgId: { extension: string }; PrimaryRoleId: { id: string; uniqueRoleId: number } };
      id: string;
      uniqueRelId: number;
    }>;
  };
  Succs?: {
    Succ: Array<{
      uniqueSuccId: number;
      Date: Array<{ Type: string; Start: string; End?: string }>;
      Type: string;
      Target: { OrgId: { extension: string }; PrimaryRoleId: { id: string } };
    }>;
  };
  Date?: Array<{ Type: string; Start: string; End?: string }>;
}

export interface OdsRole {
  id: string;
  code: string;
  displayName: string;
  primaryRole: string;
}

export interface OdsClientResult<T> {
  success: true;
  data: T;
}

export interface OdsClientError {
  success: false;
  error: string;
}

export type OdsResult<T> = OdsClientResult<T> | OdsClientError;

export class OdsClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options?: { baseUrl?: string; timeout?: number }) {
    this.baseUrl = options?.baseUrl ?? config.ods.baseUrl;
    this.timeout = options?.timeout ?? config.ods.timeout;
  }

  async searchOrganisations(params: {
    name?: string;
    roles?: string;
    primaryRoleId?: string;
    postCode?: string;
    status?: "Active" | "Inactive";
    limit?: number;
    offset?: number;
  }): Promise<OdsResult<OdsOrganisationSummary[]>> {
    const searchParams = new URLSearchParams();

    if (params.name) searchParams.set("Name", params.name);
    if (params.roles) searchParams.set("Roles", params.roles);
    if (params.primaryRoleId) searchParams.set("PrimaryRoleId", params.primaryRoleId);
    if (params.postCode) searchParams.set("PostCode", params.postCode);
    if (params.status) searchParams.set("Status", params.status);
    if (params.limit !== undefined) searchParams.set("Limit", String(params.limit));
    if (params.offset !== undefined) searchParams.set("Offset", String(params.offset));

    const result = await this.request<{ Organisations: OdsOrganisationSummary[] }>(
      `organisations?${searchParams}`,
    );

    if (!result.success) return result;

    return { success: true, data: result.data.Organisations ?? [] };
  }

  async getOrganisation(odsCode: string): Promise<OdsResult<OdsOrganisationDetail>> {
    const result = await this.request<{ Organisation: OdsOrganisationDetail }>(
      `organisations/${encodeURIComponent(odsCode)}`,
    );

    if (!result.success) return result;

    return { success: true, data: result.data.Organisation };
  }

  async listRoles(): Promise<OdsResult<OdsRole[]>> {
    const result = await this.request<{ Roles: OdsRole[] }>("roles");

    if (!result.success) return result;

    return { success: true, data: result.data.Roles ?? [] };
  }

  private async request<T>(path: string): Promise<OdsResult<T>> {
    const url = `${this.baseUrl}/${path}`;

    logger.info("ODS API request", { url });

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        logger.error("ODS API error response", { url, status: response.status, body: errorText });

        if (response.status === 404) {
          return { success: false, error: "Organisation not found in ODS directory" };
        }
        if (response.status >= 500) {
          return { success: false, error: "ODS directory service is temporarily unavailable. Try again shortly." };
        }
        return { success: false, error: `ODS API returned status ${response.status}: ${errorText}` };
      }

      const body = (await response.json()) as T;
      return { success: true, data: body };
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        logger.error("ODS API timeout", { url, timeout: this.timeout });
        return { success: false, error: `Request to ODS timed out after ${this.timeout / 1000}s` };
      }

      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("ODS API network error", { url, error: message });
      return { success: false, error: `Failed to connect to ODS: ${message}` };
    }
  }
}
