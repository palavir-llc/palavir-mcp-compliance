# Palavir Compliance MCP Server

Screen individuals and entities against three federal exclusion databases — **LEIE** (OIG healthcare exclusion list), **OFAC SDN** (Treasury sanctions), and **SAM.gov** (federal contractor exclusion) — from any MCP-compatible client (Claude Code, Claude Desktop, Cursor, Continue) in a single tool call.

Powered by the [Palavir Federal Exclusion & Sanctions Screener](https://palavir.co/exclusion-screening) API.

## Use cases

- **KYC / vendor due diligence** — screen counterparties before a contract goes out
- **Healthcare credentialing** — check providers by NPI against LEIE
- **Hire screening** — verify employees against OFAC SDN
- **Compliance workflows** — embed sanctions screening in attorney intake, procurement, AP onboarding

## Install

```bash
npm install -g @palavir/mcp-compliance
```

## Get an API key

The MCP server is free. The Compliance API behind it is metered through RapidAPI:

1. Subscribe (free tier: 100 requests/month) at the [RapidAPI listing](https://rapidapi.com/palavir-palavir-default/api/federal-exclusion-sanctions-screener)
2. Copy your `X-RapidAPI-Key`
3. Set it as `PALAVIR_COMPLIANCE_API_KEY` in your MCP client config

## Configure (Claude Desktop)

```json
{
  "mcpServers": {
    "palavir-compliance": {
      "command": "npx",
      "args": ["-y", "@palavir/mcp-compliance"],
      "env": {
        "PALAVIR_COMPLIANCE_API_KEY": "your-rapidapi-key-here"
      }
    }
  }
}
```

## Configure (Claude Code)

```bash
claude mcp add palavir-compliance \
  -e PALAVIR_COMPLIANCE_API_KEY=your-key \
  -- npx -y @palavir/mcp-compliance
```

## Tools provided

| Tool | What it does |
|---|---|
| `screen_entity` | Screen one name (with optional NPI / state / DOB) across LEIE + OFAC + SAM. Returns `risk_level` plus match details. |
| `screen_batch` | Screen up to 100 entities in a single call. |
| `get_api_info` | Return database record counts and endpoint catalog. |
| `get_api_stats` | Return current usage stats and last-refresh timestamps. |
| `health_check` | Liveness check. |

## Example

```
> screen this provider before I add them to my panel: Dr. Robert Smith, NPI 1234567890, TX

screen_entity({ name: "Robert Smith", npi: "1234567890", state: "TX" })

→ risk_level: MATCH
   database: LEIE
   exclusion_type: 1128(a)(1)
   exclusion_date: 2022-01-15
```

## Pricing

- **Free**: 100 requests/month via RapidAPI free tier
- **Paid**: $9-$49/mo metered tiers via [RapidAPI](https://rapidapi.com/palavir-palavir-default/api/federal-exclusion-sanctions-screener)
- **Enterprise**: contact josh@palavir.co for SLA + private deployment

## Data freshness

| Database | Refresh cadence | Records (as of 2026-05-25) |
|---|---|---|
| LEIE | Monthly (OIG publishes) | 83,256 |
| OFAC SDN | Daily | 19,050 |
| SAM.gov exclusion | Daily | 10,000+ |
| State Medicaid | Monthly | 543 NPIs across active states |

## License

MIT for the MCP server code. The underlying Compliance API requires a RapidAPI subscription per its terms.

## Support

- Issues: https://github.com/palavir-llc/palavir-mcp-compliance/issues
- Email: josh@palavir.co
