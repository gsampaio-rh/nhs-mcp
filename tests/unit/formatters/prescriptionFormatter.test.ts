import { describe, it, expect } from "vitest";
import { formatPrescriptionResults } from "../../../src/application/formatters/prescriptionFormatter.js";
import type { PrescriptionRecord, QueryResult } from "../../../src/application/types.js";

function makeRecord(overrides: Partial<PrescriptionRecord> = {}): PrescriptionRecord {
  return {
    bnfCode: "0407010H0",
    bnfDescription: "Paracetamol Tab 500mg",
    practiceCode: "A81001",
    practiceName: "Test Surgery",
    items: 150,
    quantity: 3000,
    netIngredientCost: 25.5,
    actualCost: 23.8,
    yearMonth: "202401",
    ...overrides,
  };
}

describe("formatPrescriptionResults", () => {
  it("returns no-results message for empty data", () => {
    const result: QueryResult<PrescriptionRecord> = {
      records: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    const output = formatPrescriptionResults(result);

    expect(output).toBe("No prescription records found matching the search criteria.");
  });

  it("formats records as a markdown table with currency", () => {
    const result: QueryResult<PrescriptionRecord> = {
      records: [makeRecord(), makeRecord({ bnfCode: "0301011R0", bnfDescription: "Salbutamol", items: 80 })],
      total: 500,
      limit: 20,
      offset: 0,
    };

    const output = formatPrescriptionResults(result);

    expect(output).toContain("Found 500 prescription record(s), showing 2");
    expect(output).toContain("BNF Code");
    expect(output).toContain("Description");
    expect(output).toContain("Net Cost");
    expect(output).toContain("0407010H0");
    expect(output).toContain("Paracetamol Tab 500mg");
    expect(output).toContain("£25.50");
    expect(output).toContain("£23.80");
    expect(output).toContain("Salbutamol");
  });

  it("uses practice code when practice name is empty", () => {
    const result: QueryResult<PrescriptionRecord> = {
      records: [makeRecord({ practiceName: "", practiceCode: "Z99999" })],
      total: 1,
      limit: 20,
      offset: 0,
    };

    const output = formatPrescriptionResults(result);

    expect(output).toContain("Z99999");
  });

  it("shows offset in summary", () => {
    const result: QueryResult<PrescriptionRecord> = {
      records: [makeRecord()],
      total: 100,
      limit: 20,
      offset: 40,
    };

    const output = formatPrescriptionResults(result);

    expect(output).toContain("offset: 40");
  });
});
