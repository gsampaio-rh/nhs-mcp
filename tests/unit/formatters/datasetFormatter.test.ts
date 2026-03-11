import { describe, it, expect } from "vitest";
import {
  formatDatasetList,
  formatDatasetMetadata,
  formatQueryResult,
} from "../../../src/application/formatters/datasetFormatter.js";
import type { DatasetSummary, DatasetMetadata, QueryResult } from "../../../src/application/types.js";

describe("formatDatasetList", () => {
  it("returns 'No datasets found' for empty list", () => {
    const result = formatDatasetList([]);
    expect(result).toBe("No datasets found.");
  });

  it("formats a list of datasets as markdown bullets", () => {
    const datasets: DatasetSummary[] = [
      { id: "1", name: "epd", title: "English Prescribing Data", notes: "Monthly GP prescribing", numResources: 5 },
      { id: "2", name: "dental", title: "Dental Statistics", notes: "", numResources: 2 },
    ];

    const result = formatDatasetList(datasets);

    expect(result).toContain("Found 2 dataset(s)");
    expect(result).toContain("**English Prescribing Data**");
    expect(result).toContain("`epd`");
    expect(result).toContain("5 resource(s)");
    expect(result).toContain("**Dental Statistics**");
    expect(result).toContain("2 resource(s)");
  });

  it("truncates long descriptions", () => {
    const longNotes = "A".repeat(200);
    const datasets: DatasetSummary[] = [
      { id: "1", name: "test", title: "Test", notes: longNotes, numResources: 1 },
    ];

    const result = formatDatasetList(datasets);

    expect(result).toContain("...");
    expect(result.length).toBeLessThan(longNotes.length + 100);
  });
});

describe("formatDatasetMetadata", () => {
  it("formats metadata with resources as markdown", () => {
    const metadata: DatasetMetadata = {
      id: "abc-123",
      name: "test-dataset",
      title: "Test Dataset",
      notes: "Dataset description",
      organization: "NHSBSA",
      metadataModified: "2024-01-15",
      resources: [
        { id: "res-1", name: "January 2024", format: "CSV", description: "Jan data", datastoreActive: true },
        { id: "res-2", name: "February 2024", format: "CSV", description: "Feb data", datastoreActive: false },
      ],
    };

    const result = formatDatasetMetadata(metadata);

    expect(result).toContain("# Test Dataset");
    expect(result).toContain("`abc-123`");
    expect(result).toContain("NHSBSA");
    expect(result).toContain("## Resources (2)");
    expect(result).toContain("January 2024");
    expect(result).toContain("`res-1`");
    expect(result).toContain("Yes");
    expect(result).toContain("No");
  });
});

describe("formatQueryResult", () => {
  it("returns 'No records found' for empty results", () => {
    const result: QueryResult<Record<string, unknown>> = {
      records: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    expect(formatQueryResult(result)).toBe("No records found.");
  });

  it("formats records as a markdown table", () => {
    const result: QueryResult<Record<string, unknown>> = {
      records: [
        { BNF_CODE: "0407010H0", ITEMS: 100, COST: 25.5 },
        { BNF_CODE: "0301011R0", ITEMS: 50, COST: 12.3 },
      ],
      total: 100,
      limit: 20,
      offset: 0,
    };

    const output = formatQueryResult(result);

    expect(output).toContain("Showing 2 of 100 record(s)");
    expect(output).toContain("BNF_CODE");
    expect(output).toContain("ITEMS");
    expect(output).toContain("0407010H0");
    expect(output).toContain("100");
    expect(output).toContain("| --- |");
  });
});
