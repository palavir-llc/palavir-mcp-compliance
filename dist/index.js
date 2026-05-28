#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
const API_BASE = process.env.PALAVIR_COMPLIANCE_API_BASE ?? "https://federal-exclusion-sanctions-screener.p.rapidapi.com";
const API_KEY = process.env.PALAVIR_COMPLIANCE_API_KEY ?? "";
if (!API_KEY) {
    console.error("[palavir-mcp-compliance] Missing PALAVIR_COMPLIANCE_API_KEY. " +
        "Get a key at https://rapidapi.com/palavir-palavir-default/api/federal-exclusion-sanctions-screener " +
        "and set it in the env.");
}
const ScreenEntitySchema = z.object({
    name: z.string().describe("Full name of individual or entity to screen"),
    npi: z.string().optional().describe("10-digit NPI for healthcare providers (boosts LEIE confidence)"),
    state: z.string().length(2).optional().describe("Two-letter US state code"),
    dob: z.string().optional().describe("Date of birth YYYY-MM-DD (boosts confidence on common names)"),
});
const BatchEntitiesSchema = z.object({
    entities: z
        .array(ScreenEntitySchema)
        .min(1)
        .max(100)
        .describe("Array of up to 100 entities to screen in one call"),
});
async function callApi(path, init = {}) {
    const url = `${API_BASE}${path}`;
    const headers = new Headers(init.headers);
    headers.set("X-RapidAPI-Key", API_KEY);
    headers.set("X-RapidAPI-Host", "federal-exclusion-sanctions-screener.p.rapidapi.com");
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Compliance API ${res.status}: ${text}`);
    }
    return res.json();
}
const server = new Server({ name: "palavir-compliance", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "screen_entity",
            description: "Screen one individual or entity against LEIE (OIG exclusion list), OFAC SDN (Treasury sanctions), " +
                "and SAM.gov (federal contractor exclusion). Returns risk_level (CLEAR | POTENTIAL | MATCH) plus " +
                "match details. Use for KYC, vendor due diligence, hire screening, healthcare credentialing.",
            inputSchema: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Full name of individual or entity" },
                    npi: { type: "string", description: "Optional 10-digit NPI for healthcare providers" },
                    state: { type: "string", description: "Optional 2-letter US state code" },
                    dob: { type: "string", description: "Optional date of birth YYYY-MM-DD" },
                },
                required: ["name"],
            },
        },
        {
            name: "screen_batch",
            description: "Screen up to 100 entities in a single call against LEIE, OFAC SDN, and SAM.gov. " +
                "Returns per-entity results plus a summary count. One HTTP request per batch (counts as 1 against the RapidAPI quota today regardless of batch size; per-entity metering may change on future plans).",
            inputSchema: {
                type: "object",
                properties: {
                    entities: {
                        type: "array",
                        maxItems: 100,
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                npi: { type: "string" },
                                state: { type: "string" },
                                dob: { type: "string" },
                            },
                            required: ["name"],
                        },
                    },
                },
                required: ["entities"],
            },
        },
        {
            name: "get_api_info",
            description: "Return API metadata: database record counts (LEIE, OFAC, SAM, state Medicaid), version, " +
                "and available endpoints. Useful for confirming data freshness before a screening run.",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "get_api_stats",
            description: "Return current API usage statistics (records loaded per database, last refresh timestamps).",
            inputSchema: { type: "object", properties: {} },
        },
        {
            name: "health_check",
            description: "Liveness check for the Compliance API. Returns status and uptime.",
            inputSchema: { type: "object", properties: {} },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let result;
        switch (name) {
            case "screen_entity": {
                const parsed = ScreenEntitySchema.parse(args);
                result = await callApi("/api/screen", {
                    method: "POST",
                    body: JSON.stringify(parsed),
                });
                break;
            }
            case "screen_batch": {
                const parsed = BatchEntitiesSchema.parse(args);
                result = await callApi("/api/screen/batch", {
                    method: "POST",
                    body: JSON.stringify(parsed),
                });
                break;
            }
            case "get_api_info":
                result = await callApi("/api/info");
                break;
            case "get_api_stats":
                result = await callApi("/api/stats");
                break;
            case "health_check":
                result = await callApi("/health");
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[palavir-mcp-compliance] Server running on stdio");
