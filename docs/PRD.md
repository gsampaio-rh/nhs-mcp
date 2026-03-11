# NHS MCP Server — Product Requirements Document

## 1. Overview

### 1.1 Problem Statement

NHS publishes rich public health datasets (prescriptions, organisations, dental statistics, pharmacy data) across multiple portals and APIs. Accessing this data requires knowledge of different API conventions (CKAN, FHIR, REST), endpoint URLs, query parameters, and data formats. This creates a high barrier for AI-assisted health data exploration and analysis.

### 1.2 Solution

Build an **MCP (Model Context Protocol) server** that wraps NHS public datasets into a unified, AI-friendly interface. Any MCP-compatible host (Cursor, Claude Desktop, VS Code, etc.) can then query NHS data through natural language — the MCP server translates intent into the correct API calls and returns structured results.

### 1.3 Value Proposition

- **For developers**: Query NHS data from their IDE without learning each API
- **For researchers**: Explore prescribing trends, organisation data, and health statistics conversationally
- **For analysts**: Get structured data ready for analysis without manual API wrangling

---

## 2. Target Users

| Persona | Need |
|---|---|
| **Developer** | Integrate NHS data into applications via a standard protocol |
| **Health Researcher** | Explore prescribing patterns, compare regions, track trends |
| **Data Analyst** | Pull structured datasets for analysis without API expertise |
| **AI Agent Builder** | Give agents access to real-world NHS data for health-related tasks |

---

## 3. NHS Data Sources

### 3.1 Sprint 0 — Core Data Sources (MVP)

These sources are free, require no authentication, and have well-documented APIs.

#### NHSBSA Open Data Portal (CKAN API)

- **Base URL**: `https://opendata.nhsbsa.net/api/3/action/`
- **Auth**: None required
- **Format**: JSON (CKAN Action API)
- **Key Datasets**:
  - English Prescribing Dataset (EPD) — GP prescribing data with SNOMED codes
  - Prescription Cost Analysis (PCA) — national prescribing cost statistics
  - Dispensing contractors data
  - Pharmacy openings and closures
  - Dental statistics
- **Update cadence**: Monthly (19th–24th of each month)

#### Organisation Data Service (ODS) — ORD API

- **Base URL**: `https://directory.spineservices.nhs.uk/ORD/2-0-0/`
- **Auth**: None required
- **Format**: JSON
- **Capabilities**:
  - Search organisations by name, postcode, role, status
  - Retrieve organisation details by ODS code
  - Organisation relationships (e.g., GP practice → ICB)
  - Succession history (mergers, splits)
- **Note**: ORD API deprecates September 2026; plan migration to FHIR R4

### 3.2 Future Sprints — Additional Sources

| Source | API | Auth | Priority |
|---|---|---|---|
| OpenPrescribing | REST | None | High |
| ODS FHIR R4 API | FHIR | None | Medium |
| NHS Outcomes Framework | TBD | TBD | Medium |
| Elective Waiting List API | REST | TBD | Low |

---

## 4. Functional Requirements

### 4.1 MCP Tools (AI-Callable Functions)

#### Prescriptions Domain

| Tool | Description | Key Parameters |
|---|---|---|
| `prescriptions/search` | Search prescribing data by BNF code, drug name, or practice | `bnf_code`, `drug_name`, `practice_code`, `year_month` |
| `prescriptions/cost_analysis` | Get prescription cost statistics | `bnf_code`, `year_month`, `region` |
| `prescriptions/spending_trends` | Analyse spending over time for a drug or category | `bnf_code`, `from_date`, `to_date` |

#### Organisations Domain

| Tool | Description | Key Parameters |
|---|---|---|
| `organisations/search` | Search NHS organisations by name, type, or location | `name`, `role`, `postcode`, `status`, `limit` |
| `organisations/get` | Get full details for an organisation by ODS code | `ods_code` |
| `organisations/relationships` | Get relationships for an organisation | `ods_code`, `relationship_type` |

#### Datasets Domain

| Tool | Description | Key Parameters |
|---|---|---|
| `datasets/list` | List all available datasets on the portal | `theme`, `search_query` |
| `datasets/metadata` | Get metadata for a specific dataset | `dataset_id` |
| `datasets/query` | Query a specific dataset resource | `resource_id`, `filters`, `limit`, `offset` |

### 4.2 MCP Resources (Read-Only Data)

| Resource URI | Description |
|---|---|
| `nhs://datasets` | Catalogue of all available NHS datasets |
| `nhs://bnf-codes` | BNF code reference (therapeutic classification) |
| `nhs://organisation-roles` | List of valid ODS organisation roles |

### 4.3 MCP Prompts (Reusable Templates)

| Prompt | Description |
|---|---|
| `analyse-prescribing` | Guide the AI through a prescribing trend analysis workflow |
| `compare-regions` | Compare prescribing patterns across regions or practices |
| `organisation-lookup` | Walk through finding and exploring an NHS organisation |

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Response time** | < 5s for search queries, < 15s for large dataset queries |
| **Error handling** | Structured errors with human-readable messages; never crash the host |
| **Rate limiting** | Respect upstream API rate limits; implement client-side throttling |
| **Caching** | Cache dataset metadata and reference data (BNF codes, org roles) with TTL |
| **Transport** | stdio for local development; streamable HTTP for remote deployment |
| **Observability** | Structured logging for all tool invocations and API calls |

---

## 6. Out of Scope (v1)

- Patient-level or identifiable data (all data is aggregate/public)
- Write operations (all NHS sources are read-only)
- Authentication proxying (only public/open APIs)
- Frontend UI (MCP servers are headless by design)
- Data storage or warehousing (pass-through only)

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| Tool invocation success rate | > 95% |
| Average response time | < 5 seconds |
| Data source coverage | 2 sources in Sprint 0, 4+ by Sprint 2 |
| Upstream API errors gracefully handled | 100% |

---

## 8. Sprint Plan

### Sprint 0 — Foundation (Week 1-2)

**Goal**: One working vertical slice — search prescribing data from Cursor.

- Project scaffolding (TypeScript, MCP SDK, dependencies)
- NHSBSA CKAN API client with error handling
- `datasets/list` and `datasets/query` tools
- `prescriptions/search` tool
- stdio transport working in Cursor
- Basic tests

### Sprint 1 — Organisations + Polish (Week 3-4)

**Goal**: Organisation lookup and improved prescriptions tools.

- ODS ORD API client
- `organisations/search` and `organisations/get` tools
- `prescriptions/cost_analysis` tool
- MCP Resources (dataset catalogue, BNF codes, org roles)
- Caching layer for reference data
- Error handling hardening

### Sprint 2 — Prompts + Additional Sources (Week 5-6)

**Goal**: Guided workflows and broader data coverage.

- MCP Prompts (`analyse-prescribing`, `compare-regions`, `organisation-lookup`)
- OpenPrescribing API integration
- `prescriptions/spending_trends` tool
- `organisations/relationships` tool
- Streamable HTTP transport option

### Sprint 3 — Production Readiness (Week 7-8)

**Goal**: Robust, documented, deployable.

- Comprehensive test suite
- Structured logging and observability
- Rate limiting and resilience patterns
- Documentation and usage examples
- ODS FHIR R4 migration path

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| NHSBSA API rate limits or downtime | Tools fail | Client-side throttling + caching + graceful error messages |
| ORD API deprecation (Sept 2026) | Organisation tools break | Plan FHIR R4 migration in Sprint 3 |
| Large dataset responses exceed context window | AI can't process results | Pagination, summarisation, configurable `limit` defaults |
| CKAN API schema changes | Queries break | Version-pin API endpoints, add integration tests |
| developer.nhs.uk decommission (March 2026) | Endpoint URLs change | Monitor NHS announcements, abstract base URLs into config |

---

## 10. Technology Stack

| Component | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Type safety, MCP SDK maturity, Zod integration |
| MCP SDK | `@modelcontextprotocol/sdk` | Official SDK, well-maintained |
| Validation | Zod | Schema validation with descriptions for AI parameter understanding |
| HTTP Client | `fetch` (native) | No extra dependencies, built into Node 18+ |
| Testing | Vitest | Fast, TypeScript-native, compatible ecosystem |
| Transport | stdio (dev), streamable HTTP (prod) | stdio for Cursor/local; HTTP for shared deployment |
| Runtime | Node.js 20+ LTS | Stable, native fetch, ESM support |
