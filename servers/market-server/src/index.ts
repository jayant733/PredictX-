#!/usr/bin/env node
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createLogger, loadEnv, FileCache } from "@autonomous-traders/shared";
import { YahooMarketData } from "./yahoo.js";

loadEnv();
const log = createLogger("market-server");

// ── Schemas (the LLM reads `describe()` strings to decide when to call) ──

const GetSharePriceSchema = z.object({
  ticker: z.string().min(1).max(8).describe("Stock ticker, e.g. 'AAPL'"),
});
type GetSharePriceArgs = z.infer<typeof GetSharePriceSchema>;

const GetCompanyInfoSchema = z.object({
  ticker: z.string().min(1).max(8).describe("Stock ticker, e.g. 'AAPL'"),
});
type GetCompanyInfoArgs = z.infer<typeof GetCompanyInfoSchema>;

// ── Main ──

async function main(): Promise<void> {
  const cache = new FileCache("data/cache/market");
  const market = new YahooMarketData(cache);

  const tools = [
    {
      name: "get_share_price",
      description:
        "Get the latest share price for a ticker using end-of-day or delayed data (free tier). " +
        "Returns price, currency, previous close, and volume.",
      inputSchema: zodToJsonSchema(GetSharePriceSchema as any, {
        target: "openApi3",
      }) as Record<string, unknown>,
      handler: async (raw: unknown) => {
        const a = (GetSharePriceSchema as any).parse(raw) as GetSharePriceArgs;
        return market.getQuote(a.ticker);
      },
    },
    {
      name: "get_company_info",
      description:
        "Get company profile: name, sector, industry, and a short description. " +
        "Use this for fundamental analysis of a stock.",
      inputSchema: zodToJsonSchema(GetCompanyInfoSchema as any, {
        target: "openApi3",
      }) as Record<string, unknown>,
      handler: async (raw: unknown) => {
        const a = (GetCompanyInfoSchema as any).parse(raw) as GetCompanyInfoArgs;
        return market.getCompanyInfo(a.ticker);
      },
    },
  ];

  const server = new Server(
    { name: "market-server", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params.name;
    const tool = tools.find((t) => t.name === name);
    if (!tool) throw new Error(`unknown tool: ${name}`);
    try {
      const result = await tool.handler(req.params.arguments);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: `Error: ${msg}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("market-server listening on stdio", { tools: tools.length });
}

main().catch((err) => {
  log.error("fatal", { err: String(err) });
  process.exit(1);
});
