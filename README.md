# NHS MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that provides AI assistants with access to NHS public health datasets. Query prescribing data, explore datasets, and look up NHS organisations directly from Cursor, Claude Desktop, or any MCP-compatible host.

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Install and Build

```bash
npm install
npm run build
```

### Configure Cursor

The project includes a `.cursor/mcp.json` that registers the server automatically. After building, restart Cursor to pick up the MCP server.

To configure manually in any MCP host, register a stdio server:

```json
{
  "mcpServers": {
    "nhs": {
      "command": "node",
      "args": ["/path/to/nhs-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### `datasets_list`

List all available datasets on the NHSBSA Open Data Portal.

**Parameters:**
- `search_query` (optional) — Filter datasets by title or description

**Example prompt:** *"List all NHS datasets related to prescribing"*

### `datasets_metadata`

Get detailed metadata for a specific dataset, including resource IDs needed for querying.

**Parameters:**
- `dataset_id` (required) — Dataset name or ID

**Example prompt:** *"Show me the metadata for the English Prescribing Dataset"*

### `datasets_query`

Query a specific dataset resource by its resource ID. Use `datasets_metadata` first to discover resource IDs.

**Parameters:**
- `resource_id` (required) — The resource ID to query
- `filters` (optional) — Key-value pairs to filter records
- `limit` (optional) — Max records to return (default 20, max 100)
- `offset` (optional) — Records to skip for pagination

**Example prompt:** *"Query resource abc-123 filtering by BNF_CODE 0407010H0"*

### `prescriptions_search`

Search NHS prescribing data from the English Prescribing Dataset (EPD).

**Parameters:**
- `bnf_code` (optional) — BNF code (e.g., `0407010H0` for Paracetamol)
- `drug_name` (optional) — Free-text drug name search
- `practice_code` (optional) — GP practice code
- `year_month` (optional) — Period in YYYYMM format
- `resource_id` (optional) — Specific EPD resource ID
- `limit` (optional) — Max records (default 20, max 100)

**Example prompt:** *"Search for Paracetamol prescriptions in January 2024"*

## Data Sources

| Source | API | Auth Required |
|---|---|---|
| [NHSBSA Open Data Portal](https://opendata.nhsbsa.net) | CKAN Action API | No |

## Development

### Project Structure

```
src/
├── mcp/                    # MCP protocol layer (tools, server setup)
│   ├── server.ts
│   └── tools/
├── application/            # Business logic (use cases, formatters, types)
│   ├── use-cases/
│   ├── formatters/
│   └── types.ts
└── infrastructure/         # External concerns (API clients, cache, config)
    ├── clients/
    ├── cache/
    ├── config.ts
    └── logger.ts
```

### Commands

```bash
npm run build       # Compile TypeScript
npm run dev         # Watch mode
npm test            # Run tests
npm run test:watch  # Watch mode tests
npm start           # Start MCP server (stdio)
```

### Running Tests

```bash
npm test
```

Tests mock all external HTTP calls. No network access is required.

## License

MIT
