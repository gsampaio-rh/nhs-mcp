export const config = {
  nhsbsa: {
    baseUrl: "https://opendata.nhsbsa.net/api/3/action",
    timeout: 15_000,
  },
  ods: {
    baseUrl: "https://directory.spineservices.nhs.uk/ORD/2-0-0",
    timeout: 10_000,
  },
  openPrescribing: {
    baseUrl: "https://openprescribing.net/api/1.0",
    timeout: 30_000,
  },
  defaults: {
    queryLimit: 20,
    maxQueryLimit: 100,
  },
  cache: {
    datasetCatalogueTtl: 24 * 60 * 60 * 1000,
    organisationRolesTtl: 7 * 24 * 60 * 60 * 1000,
  },
} as const;
