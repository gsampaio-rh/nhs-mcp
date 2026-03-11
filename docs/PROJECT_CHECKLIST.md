# NHS MCP Server — Project Checklist

## Sprint 0 — Foundation

**Goal**: One working vertical slice — query NHS prescribing data from Cursor via MCP.

### Setup

- [x] Initialise Node.js project (`package.json`, TypeScript, ESM)
- [x] Install dependencies (`@modelcontextprotocol/sdk`, `zod`, `vitest`)
- [x] Configure `tsconfig.json` (strict mode, ESM, path aliases)
- [x] Configure `vitest.config.ts`
- [x] Create directory structure (`src/mcp/`, `src/application/`, `src/infrastructure/`)
- [x] Create entry point (`src/index.ts`) with stdio transport
- [x] Configure Cursor MCP integration (`.cursor/mcp.json`)

### Infrastructure

- [x] Implement `src/infrastructure/config.ts` (base URLs, timeouts, defaults)
- [x] Implement `src/infrastructure/logger.ts` (structured logging)
- [x] Implement `src/infrastructure/clients/nhsbsa.ts` (CKAN API client)
- [x] Implement `src/infrastructure/cache/memoryCache.ts` (in-memory TTL cache)

### Application

- [x] Define application types (`src/application/types.ts`)
- [x] Implement `listDatasets` use case
- [x] Implement `queryDataset` use case
- [x] Implement `searchPrescriptions` use case
- [x] Implement dataset formatter
- [x] Implement prescription formatter

### MCP Layer

- [x] Set up MCP server (`src/mcp/server.ts`)
- [x] Register `datasets/list` tool
- [x] Register `datasets/query` tool
- [x] Register `prescriptions/search` tool

### Testing

- [x] Unit tests for NHSBSA client (mocked fetch)
- [x] Unit tests for use cases (mocked client)
- [x] Unit tests for formatters
- [x] Manual end-to-end test via MCP protocol (datasets_list verified against live API)

### Documentation

- [x] PRD (`docs/PRD.md`)
- [x] Architecture (`docs/ARCHITECTURE.md`)
- [x] Project checklist (`docs/PROJECT_CHECKLIST.md`)
- [x] README with setup and usage instructions

### Definition of Done — Sprint 0

- [x] `datasets/list` returns the list of NHS datasets when invoked from Cursor
- [x] `datasets/query` returns filtered results from a specific dataset resource
- [x] `prescriptions/search` returns prescribing data for a given drug or practice
- [x] All tools return structured, readable text responses
- [x] Errors from upstream APIs are handled gracefully (no crashes)
- [x] Unit tests pass
- [x] README explains how to install and use the server

---

## Sprint 1 — Organisations + Polish

**Goal**: Organisation lookup and improved prescriptions tools.

- [x] Implement ODS ORD API client (`src/infrastructure/clients/ods.ts`)
- [x] Implement `searchOrganisations` use case
- [x] Implement `getOrganisation` use case
- [x] Implement organisation formatter
- [x] Register `organisations/search` tool
- [x] Register `organisations/get` tool
- [x] Implement `getCostAnalysis` use case
- [x] Register `prescriptions/cost_analysis` tool
- [x] Implement MCP Resources (`nhs://datasets`, `nhs://organisation-roles`)
- [x] Add caching for dataset catalogue and organisation roles
- [x] Harden error handling across all tools
- [x] Unit tests for ODS client and new use cases
- [x] Integration tests for tool invocations

---

## Sprint 2 — Prompts + Additional Sources

**Goal**: Guided workflows and broader data coverage.

- [ ] Implement OpenPrescribing API client
- [ ] Implement `getSpendingTrends` use case
- [ ] Register `prescriptions/spending_trends` tool
- [ ] Implement `getOrganisationRelationships` use case
- [ ] Register `organisations/relationships` tool
- [ ] Implement MCP Prompts (`analyse-prescribing`, `compare-regions`, `organisation-lookup`)
- [ ] Implement `nhs://bnf-codes` resource
- [ ] Add streamable HTTP transport option
- [ ] Tests for new tools and prompts

---

## Sprint 3 — Production Readiness

**Goal**: Robust, documented, deployable.

- [ ] Comprehensive test suite (>80% coverage)
- [ ] Rate limiting / throttling for upstream APIs
- [ ] Structured logging and observability
- [ ] ODS FHIR R4 migration path (research + prototype)
- [ ] Usage examples in documentation
- [ ] Containerisation (Dockerfile)
- [ ] CI pipeline (lint, test, build)
