/**
 * Minimal namespace logger. No external dep — keeps MCP server processes lean.
 * Format: [ISO ts] [LEVEL] [namespace] message
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};
const RESET = "\x1b[0m";

function currentMinLevel(): LogLevel {
  const v = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  return v in LEVEL_PRIORITY ? (v as LogLevel) : "info";
}

export class Logger {
  constructor(private readonly namespace: string) {}

  private write(level: LogLevel, msg: string, meta?: unknown): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[currentMinLevel()]) return;
    const ts = new Date().toISOString();
    const prefix = `${COLORS[level]}[${ts}] [${level.toUpperCase()}]${RESET} [${this.namespace}]`;
    const tail = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
    // Always write to stderr. stdout is reserved for JSON-RPC in MCP stdio
    // servers, so logging there would corrupt the protocol.
    process.stderr.write(`${prefix} ${msg}${tail}\n`);
  }

  debug(msg: string, meta?: unknown): void { this.write("debug", msg, meta); }
  info(msg: string, meta?: unknown): void { this.write("info", msg, meta); }
  warn(msg: string, meta?: unknown): void { this.write("warn", msg, meta); }
  error(msg: string, meta?: unknown): void { this.write("error", msg, meta); }
}

/** Convenience factory — `const log = createLogger("accounts");` */
export function createLogger(namespace: string): Logger {
  return new Logger(namespace);
}
