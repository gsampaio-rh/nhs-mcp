import { describe, it, expect } from "vitest";
import {
  formatOrganisationSearchResults,
  formatOrganisationDetail,
  formatCostAnalysisResults,
} from "../../../src/application/formatters/organisationFormatter.js";
import type { OrganisationSummary, OrganisationDetail, CostAnalysisRecord, QueryResult } from "../../../src/application/types.js";

describe("formatOrganisationSearchResults", () => {
  it("formats organisation list as markdown table", () => {
    const orgs: OrganisationSummary[] = [
      {
        orgId: "RR8",
        name: "LEEDS TEACHING HOSPITALS NHS TRUST",
        status: "Active",
        postCode: "LS1 3EX",
        lastChangeDate: "2024-01-15",
        primaryRoleId: "RO197",
        primaryRoleDescription: "NHS TRUST",
      },
    ];

    const result = formatOrganisationSearchResults(orgs);

    expect(result).toContain("Found 1 organisation(s)");
    expect(result).toContain("RR8");
    expect(result).toContain("LEEDS TEACHING HOSPITALS NHS TRUST");
    expect(result).toContain("NHS TRUST");
    expect(result).toContain("LS1 3EX");
  });

  it("returns message when no organisations found", () => {
    const result = formatOrganisationSearchResults([]);

    expect(result).toContain("No organisations found");
  });
});

describe("formatOrganisationDetail", () => {
  it("formats full organisation detail with address and roles", () => {
    const org: OrganisationDetail = {
      orgId: "RJY12",
      name: "PLATT BRIDGE CLINIC",
      status: "Inactive",
      lastChangeDate: "2013-05-08",
      recordClass: "RC2",
      address: {
        line1: "VICTORIA STREET",
        town: "WIGAN",
        postCode: "WN2 5AH",
        country: "ENGLAND",
      },
      roles: [
        { id: "RO198", primaryRole: true, status: "Inactive", startDate: "1993-04-01", endDate: "2001-03-31" },
      ],
      relationships: [],
      successors: [],
    };

    const result = formatOrganisationDetail(org);

    expect(result).toContain("# PLATT BRIDGE CLINIC");
    expect(result).toContain("`RJY12`");
    expect(result).toContain("Inactive");
    expect(result).toContain("VICTORIA STREET");
    expect(result).toContain("WN2 5AH");
    expect(result).toContain("RO198");
    expect(result).toContain("1993-04-01");
  });

  it("handles null address", () => {
    const org: OrganisationDetail = {
      orgId: "TEST",
      name: "TEST ORG",
      status: "Active",
      lastChangeDate: "2024-01-01",
      recordClass: "RC1",
      address: null,
      roles: [],
      relationships: [],
      successors: [],
    };

    const result = formatOrganisationDetail(org);

    expect(result).toContain("# TEST ORG");
    expect(result).not.toContain("Address");
  });

  it("formats relationships section", () => {
    const org: OrganisationDetail = {
      orgId: "A81001",
      name: "GP PRACTICE",
      status: "Active",
      lastChangeDate: "2024-01-01",
      recordClass: "RC1",
      address: null,
      roles: [],
      relationships: [
        { id: "RE4", status: "Active", targetOrgId: "QWO", targetPrimaryRoleId: "RO98" },
      ],
      successors: [],
    };

    const result = formatOrganisationDetail(org);

    expect(result).toContain("Relationships (1)");
    expect(result).toContain("RE4");
    expect(result).toContain("QWO");
  });

  it("formats succession history", () => {
    const org: OrganisationDetail = {
      orgId: "OLD1",
      name: "OLD ORG",
      status: "Inactive",
      lastChangeDate: "2024-01-01",
      recordClass: "RC1",
      address: null,
      roles: [],
      relationships: [],
      successors: [{ type: "Successor", targetOrgId: "NEW1" }],
    };

    const result = formatOrganisationDetail(org);

    expect(result).toContain("Succession History");
    expect(result).toContain("Successor");
    expect(result).toContain("NEW1");
  });
});

describe("formatCostAnalysisResults", () => {
  it("formats cost analysis records as markdown table", () => {
    const data: QueryResult<CostAnalysisRecord> = {
      records: [
        {
          bnfCode: "0407010H0",
          bnfDescription: "Paracetamol",
          items: 1500,
          quantity: 45000,
          netIngredientCost: 2500.5,
          actualCost: 2300.25,
          yearMonth: "202401",
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    };

    const result = formatCostAnalysisResults(data);

    expect(result).toContain("Found 1 cost analysis record(s)");
    expect(result).toContain("0407010H0");
    expect(result).toContain("Paracetamol");
    expect(result).toContain("£2500.50");
    expect(result).toContain("£2300.25");
  });

  it("returns message when no records found", () => {
    const data: QueryResult<CostAnalysisRecord> = {
      records: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    const result = formatCostAnalysisResults(data);

    expect(result).toContain("No cost analysis records found");
  });
});
