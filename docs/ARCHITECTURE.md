# NHS MCP Server — Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     MCP Hosts                           │
│         (Cursor, Claude Desktop, VS Code)               │
└──────────────────────┬──────────────────────────────────┘
                       │ JSON-RPC 2.0
                       │ (stdio / streamable HTTP)
┌──────────────────────▼──────────────────────────────────┐
│                   NHS MCP Server                        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  MCP Layer                        │  │
│  │  Tools · Resources · Prompts · Transport          │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │              Application Layer                    │  │
│  │  Use Cases · Response Formatting · Pagination     │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │             Infrastructure Layer                  │  │
│  │  API Clients · Cache · Config · Logging           │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   NHSBSA     │ │  ODS ORD     │ │ OpenPrescr.  │
│   CKAN API   │ │  API         │ │ API          │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 MCP Layer (`src/mcp/`)

The outermost layer. Registers tools, resources, and prompts with the MCP SDK. Translates between the MCP protocol and the application layer. Contains no business logic.

| Component | Responsibility |
|---|---|
| `tools/` | Tool definitions (name, schema, description) and handlers that delegate to use cases |
| `resources/` | Resource URI handlers that return read-only data |
| `prompts/` | Prompt template definitions |
| `server.ts` | MCP server setup, capability registration, transport binding |

### 2.2 Application Layer (`src/application/`)

Orchestrates business logic. Each use case is a single function that coordinates API clients, formats responses, and handles pagination. No direct knowledge of MCP or HTTP APIs.

| Component | Responsibility |
|---|---|
| `use-cases/` | One file per use case (e.g., `searchPrescriptions.ts`, `getOrganisation.ts`) |
| `formatters/` | Transform raw API responses into AI-friendly text/structured output |
| `types.ts` | Application-level types (use case inputs/outputs) |

### 2.3 Infrastructure Layer (`src/infrastructure/`)

Handles all external concerns: HTTP calls, caching, configuration. Implements interfaces consumed by the application layer.

| Component | Responsibility |
|---|---|
| `clients/` | API clients per data source (`nhsbsa.ts`, `ods.ts`, `openPrescribing.ts`) |
| `cache/` | In-memory cache with TTL for reference data and metadata |
| `config.ts` | Centralised configuration (API base URLs, timeouts, defaults) |
| `logger.ts` | Structured logging |

---

## 3. Directory Structure

```
nhs-mcp/
├── src/
│   ├── mcp/
│   │   ├── server.ts              # MCP server setup and transport
│   │   ├── tools/
│   │   │   ├── prescriptions.ts   # prescriptions/* tool definitions
│   │   │   ├── organisations.ts   # organisations/* tool definitions
│   │   │   └── datasets.ts        # datasets/* tool definitions
│   │   ├── resources/
│   │   │   └── catalogue.ts       # nhs:// resource handlers
│   │   └── prompts/
│   │       └── templates.ts       # Prompt template definitions
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── searchPrescriptions.ts
│   │   │   ├── getCostAnalysis.ts
│   │   │   ├── searchOrganisations.ts
│   │   │   ├── getOrganisation.ts
│   │   │   ├── listDatasets.ts
│   │   │   └── queryDataset.ts
│   │   ├── formatters/
│   │   │   ├── prescriptionFormatter.ts
│   │   │   ├── organisationFormatter.ts
│   │   │   └── datasetFormatter.ts
│   │   └── types.ts
│   ├── infrastructure/
│   │   ├── clients/
│   │   │   ├── nhsbsa.ts          # NHSBSA CKAN API client
│   │   │   ├── ods.ts             # ODS ORD API client
│   │   │   └── openPrescribing.ts # OpenPrescribing API client
│   │   ├── cache/
│   │   │   └── memoryCache.ts     # In-memory TTL cache
│   │   ├── config.ts              # Centralised configuration
│   │   └── logger.ts              # Structured logger
│   └── index.ts                   # Entry point
├── tests/
│   ├── unit/
│   │   ├── use-cases/
│   │   ├── formatters/
│   │   └── clients/
│   └── integration/
│       └── tools/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── PROJECT_CHECKLIST.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 4. Data Flow

### Tool Invocation (e.g., `prescriptions/search`)

```
1. Host sends JSON-RPC `tools/call` → MCP SDK
2. MCP SDK routes to tool handler in src/mcp/tools/prescriptions.ts
3. Handler validates input (Zod schema) and calls use case
4. Use case (src/application/use-cases/searchPrescriptions.ts):
   a. Calls NHSBSA client to query CKAN API
   b. Passes raw response through formatter
   c. Returns structured result
5. Tool handler wraps result in MCP content response
6. MCP SDK sends JSON-RPC response → Host
```

### Resource Read (e.g., `nhs://datasets`)

```
1. Host sends JSON-RPC `resources/read` → MCP SDK
2. MCP SDK routes to resource handler in src/mcp/resources/catalogue.ts
3. Handler checks cache → if miss, calls NHSBSA client for dataset list
4. Returns formatted catalogue as text content
5. MCP SDK sends JSON-RPC response → Host
```

---

## 5. API Client Design

Each external API gets a dedicated client class following a consistent pattern.

```typescript
// Pattern for all API clients
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
}

class NhsbsaClient {
  constructor(private config: ApiClientConfig) {}

  async listDatasets(): Promise<Dataset[]> { ... }
  async queryResource(resourceId: string, filters: Record<string, string>): Promise<QueryResult> { ... }
  async getDatasetMetadata(datasetId: string): Promise<DatasetMetadata> { ... }
}
```

### Error Handling Strategy

All API clients follow the same error contract:

1. **Network errors** → Return structured error with `isError: true`, human-readable message
2. **4xx responses** → Parse error body, return contextual message (e.g., "Dataset not found")
3. **5xx responses** → Return "NHS service temporarily unavailable" with retry suggestion
4. **Timeouts** → Return timeout message with the upstream service name

Errors never throw — they return MCP-compatible error responses so the AI can decide what to do next.

---

## 6. Caching Strategy

| Data Type | TTL | Rationale |
|---|---|---|
| Dataset catalogue | 24 hours | Datasets change monthly |
| Dataset metadata | 24 hours | Schema rarely changes |
| BNF code reference | 7 days | Updated monthly, stable between updates |
| Organisation roles | 7 days | Very stable reference data |
| Query results | No cache | Queries may have different parameters each time |

Implementation: Simple in-memory `Map<string, { data, expiry }>` — no external dependencies.

---

## 7. Tool Design Principles

### Naming Convention

Tools use a `domain/action` namespace pattern:

```
prescriptions/search
prescriptions/cost_analysis
organisations/search
organisations/get
datasets/list
datasets/query
```

### Parameter Design

Every tool parameter includes a `description` in its Zod schema — this is critical because the AI model reads these descriptions to understand when and how to use each parameter.

```typescript
z.object({
  bnf_code: z.string().optional().describe(
    "BNF code to filter by (e.g., '0407010H0' for Paracetamol). Supports partial codes for category-level queries."
  ),
  year_month: z.string().optional().describe(
    "Year and month in YYYYMM format (e.g., '202401' for January 2024)"
  ),
  limit: z.number().default(20).describe(
    "Maximum number of results to return. Default 20, max 100."
  ),
})
```

### Response Format

All tools return structured text content optimised for AI consumption:

```typescript
{
  content: [{
    type: "text",
    text: "Found 15 prescribing records for Paracetamol (0407010H0) in January 2024:\n\n| Practice | Items | Cost |\n|---|---|---|\n| ... "
  }]
}
```

Markdown tables for tabular data. Bullet lists for metadata. Plain text for summaries.

---

## 8. Transport Configuration

### Development (stdio)

```jsonc
// .cursor/mcp.json
{
  "mcpServers": {
    "nhs": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

### Production (streamable HTTP)

```bash
node dist/index.js --transport http --port 3000
```

The server reads transport mode from CLI args or environment variables. The `src/index.ts` entry point selects the appropriate MCP transport adapter.

---

## 9. Testing Strategy

| Layer | Test Type | What's Tested |
|---|---|---|
| `clients/` | Unit (mocked HTTP) | API request construction, response parsing, error handling |
| `use-cases/` | Unit (mocked clients) | Business logic, pagination, edge cases |
| `formatters/` | Unit | Output formatting correctness |
| `tools/` | Integration | End-to-end tool invocation via MCP SDK test utilities |

### Test doubles

- API clients: Mock `fetch` responses with realistic payloads captured from real API calls
- Cache: Use real in-memory cache (no mocking needed)
- MCP SDK: Use SDK's built-in test transport for integration tests

---

## 10. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| TypeScript over Python | TypeScript | Zod schemas serve double duty (validation + AI descriptions), strong MCP SDK, consistent with Cursor ecosystem |
| Layered architecture | MCP → Application → Infrastructure | Separation of concerns; swap API clients without touching tools |
| In-memory cache over Redis | `Map` with TTL | Single-process server, no infra dependencies, sufficient for reference data |
| Namespace tool names | `domain/action` | Scales to many tools without ambiguity; AI can reason about domains |
| Return errors, don't throw | Structured error responses | AI host can decide how to handle; prevents server crashes |
| No database | Pass-through only | We don't store data; we proxy public APIs |
| ORD API first, FHIR R4 later | ORD is simpler, stable until Sept 2026 | Lower Sprint 0 complexity; FHIR migration is a planned iteration |

---

## 11. Dependency Graph

```
src/index.ts
  └── src/mcp/server.ts
        ├── src/mcp/tools/*          (depends on use cases)
        ├── src/mcp/resources/*      (depends on use cases + cache)
        └── src/mcp/prompts/*        (no dependencies)

src/mcp/tools/*
  └── src/application/use-cases/*    (depends on clients + formatters)

src/application/use-cases/*
  ├── src/infrastructure/clients/*   (HTTP calls)
  ├── src/application/formatters/*   (response formatting)
  └── src/infrastructure/cache/*     (optional caching)

src/infrastructure/clients/*
  └── src/infrastructure/config.ts   (base URLs, timeouts)
```

No circular dependencies. Each layer only imports from the layer below.
