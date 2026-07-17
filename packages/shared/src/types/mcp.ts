/**
 * Types for MCP server params + agent definitions.
 * Mirrors the shape consumed by an MCP stdio client.
 */

/** Transport for an MCP server. We only need stdio for now. */
export type McpTransport = "stdio";

/** Bare command that launches one MCP server as a child process. */
export interface McpServerParams {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport?: McpTransport;
  /** Seconds before the client gives up waiting on a tool call. */
  clientSessionTimeoutSeconds?: number;
}

/** A named bundle of MCP servers handed to one agent. */
export interface McpServerGroup {
  name: string;
  servers: McpServerParams[];
}

/** The two agent personas in this system. */
export type AgentRole = "trader" | "researcher";

/** Static definition of one agent (used by the orchestrator to build it). */
export interface AgentDefinition {
  name: string;
  role: AgentRole;
  instructions: string;
  model: string;
  mcpServers: McpServerParams[];
}
