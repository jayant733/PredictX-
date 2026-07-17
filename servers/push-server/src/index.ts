#!/usr/bin/env node
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createLogger, loadEnv } from "@autonomous-traders/shared";
import { sendPush } from "./push.js";

loadEnv();
const log = createLogger("push-server");

/** Zod schema — the LLM sees the `describe()` strings. */
const PushSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(1024)
    .describe("A brief message to push — trade summary or portfolio alert"),
  title: z
    .string()
    .max(250)
    .optional()
    .describe("Optional title for the push notification"),
});

async function main(): Promise<void> {
  const tools = [
    {
      name: "push",
      description: "Send a push notification with a brief trading summary or alert.",
      inputSchema: zodToJsonSchema(PushSchema as any, { target: "openApi3" }) as Record<string, unknown>,
      handler: async (raw: unknown) => {
        const args = (PushSchema as any).parse(raw);
        return sendPush(args.message, args.title);
      },
    },
  ];

  const server = new Server(
    { name: "push-server", version: "0.1.0" },
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
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("push-server listening on stdio", { tools: tools.length });
}

main().catch((err) => {
  log.error("fatal", { err: String(err) });
  process.exit(1);
});
