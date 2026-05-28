# Palavir Compliance MCP Server

Screen individuals and entities against three federal exclusion databases — **LEIE** (OIG healthcare exclusion list), **OFAC SDN** (Treasury sanctions), and **SAM.gov** (federal contractor exclusion) — from any MCP-compatible client (Claude Code, Claude Desktop, Cursor, Continue) in a single tool call.

**269,819 verified federal records, refreshed daily.** Pricing starts at $0 (100 evaluations/month) and scales to $999/mo for enterprise KYC volume — 10-50x cheaper than Trulioo, Sayari, or Comply Advantage.

## Pricing

| Tier | Price/mo | Requests/mo | Best for |
|---|---|---|---|
| **Basic** | $0 | 100 | Evaluation, hobbyist scripts, one-off lookups |
| **Starter** | $29 | 1,000 | Solo founder, small consultancy, vendor onboarding |
| **Pro** | $99 | 10,000 | KYC compliance team, AP / procurement, healthcare credentialing |
| **Ultra** | $299 | 50,000 | Mid-market platform, multi-product KYC, scaled vendor risk |
| **Enterprise** | $999 | 250,000 | KYC SaaS subprocessor, large lender, gov contractor |

Subscribe at the [RapidAPI listing](https://rapidapi.com/josh-BN5mWmPiY/api/federal-exclusion-sanctions-screener) to get your API key.

## Use cases

- **KYC / vendor due diligence** — screen counterparties before contracting
- **Healthcare credentialing** — check providers by NPI against LEIE
- **AP / procurement** — confirm vendors are not OFAC- or SAM-excluded before issuing PO
- **Hire screening** — verify employees against OFAC SDN
- **Investor diligence** — pre-deal screen on target company + officers + directors
- **Compliance workflows** — embed sanctions screening in attorney intake, contract review

## Install

```bash
npm install -g @palavir/mcp-compliance
```

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
| `screen_batch` | Screen up to 100 entities in a single call (counts as 1 against your request quota). |
| `get_api_info` | Return database record counts and endpoint catalog. |
| `get_api_stats` | Return current usage stats and last-refresh timestamps. |
| `health_check` | Liveness check. |

## Example

```
> screen this provider before I add them to my panel

screen_entity({ name: "<provider name>", npi: "<10-digit NPI>", state: "<2-letter state>" })

→ {
    "risk_level": "MATCH | POTENTIAL | CLEAR",
    "matches": [{
      "database": "LEIE | OFAC_SDN | SAM",
      "confidence": 0.0,
      "details": { ... }
    }]
  }
```

NPI matches in LEIE return confidence 1.0 (deterministic). Name-only matches use Jaccard similarity above a configurable threshold.

## Rate limits

Two independent limits apply on every plan:

1. A **monthly request quota** set by your plan (e.g. 100/mo on Basic, 10,000/mo on Pro)
2. A **per-minute rate limit** (1/min on Basic, 5/min Starter, 30/min Pro, 100/min Ultra, 300/min Enterprise)

Either limit returns HTTP 429 when exceeded. `screen_batch` sends one HTTP request regardless of how many entities are in the batch.

## Data freshness

| Database | Refresh cadence | Records |
|---|---|---|
| LEIE | Monthly (OIG publishes) | 83,256 |
| OFAC SDN | Daily | 19,050 |
| SAM.gov exclusion | Daily | 167,513 |

## Why this beats DIY

Building OFAC + LEIE + SAM screening in-house typically takes 2-4 weeks of engineering (download parsing, name-normalization, fuzzy matching, daily refresh, rate-limit handling). The Starter tier at **$29/mo** pays for itself if it saves a single half-day of engineering time, and the Pro tier scales to 10,000 screens/mo for the price of a 1-hour consult.

## License

MIT for the MCP server code. The underlying Compliance API requires a RapidAPI subscription per its terms.

## Support

- Issues: https://github.com/palavir-llc/palavir-mcp-compliance/issues
- Email: josh@palavir.co
- Listing: https://rapidapi.com/josh-BN5mWmPiY/api/federal-exclusion-sanctions-screener
