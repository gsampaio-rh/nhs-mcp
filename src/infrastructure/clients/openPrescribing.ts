import { config } from "../config.js";
import { logger } from "../logger.js";

export interface SpendingRecord {
  date: string;
  actual_cost: number;
  items: number;
  quantity: number;
  row_id: string | null;
  row_name: string;
}

export interface OpenPrescribingClientResult<T> {
  success: true;
  data: T;
}

export interface OpenPrescribingClientError {
  success: false;
  error: string;
}

export type OpenPrescribingResult<T> =
  | OpenPrescribingClientResult<T>
  | OpenPrescribingClientError;

export class OpenPrescribingClient {
  private baseUrl: string;
  private timeout: number;

  constructor(options?: { baseUrl?: string; timeout?: number }) {
    this.baseUrl = options?.baseUrl ?? config.openPrescribing.baseUrl;
    this.timeout = options?.timeout ?? config.openPrescribing.timeout;
  }

  async spending(params: {
    code: string;
    format?: string;
  }): Promise<OpenPrescribingResult<SpendingRecord[]>> {
    const searchParams = new URLSearchParams({
      code: params.code,
      format: params.format ?? "json",
    });
    return this.request<SpendingRecord[]>(`spending/?${searchParams}`);
  }

  async spendingByOrg(params: {
    code: string;
    orgType: "sicbl" | "practice";
    org?: string;
    date?: string;
    format?: string;
  }): Promise<OpenPrescribingResult<SpendingRecord[]>> {
    const searchParams = new URLSearchParams({
      code: params.code,
      org_type: params.orgType,
      format: params.format ?? "json",
    });
    if (params.org) searchParams.set("org", params.org);
    if (params.date) searchParams.set("date", params.date);

    return this.request<SpendingRecord[]>(`spending_by_org/?${searchParams}`);
  }

  private async request<T>(path: string): Promise<OpenPrescribingResult<T>> {
    const url = `${this.baseUrl}/${path}`;

    logger.info("OpenPrescribing API request", { url });

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.timeout),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        logger.error("OpenPrescribing API error response", {
          url,
          status: response.status,
          body: errorText,
        });

        if (response.status === 404) {
          return { success: false, error: "Resource not found on OpenPrescribing" };
        }
        if (response.status >= 500) {
          return { success: false, error: "OpenPrescribing service is temporarily unavailable. Try again shortly." };
        }
        return { success: false, error: `OpenPrescribing API returned status ${response.status}: ${errorText}` };
      }

      const body = (await response.json()) as T;
      return { success: true, data: body };
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        logger.error("OpenPrescribing API timeout", { url, timeout: this.timeout });
        return { success: false, error: `Request to OpenPrescribing timed out after ${this.timeout / 1000}s` };
      }

      const message = err instanceof Error ? err.message : "Unknown network error";
      logger.error("OpenPrescribing API network error", { url, error: message });
      return { success: false, error: `Failed to connect to OpenPrescribing: ${message}` };
    }
  }
}
