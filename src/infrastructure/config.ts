export const config = {
  nhsbsa: {
    baseUrl: "https://opendata.nhsbsa.net/api/3/action",
    timeout: 15_000,
  },
  defaults: {
    queryLimit: 20,
    maxQueryLimit: 100,
  },
} as const;
