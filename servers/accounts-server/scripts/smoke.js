// Smoke test: drive the accounts-server over stdio as a real MCP client would.
// Sends initialize -> list tools -> call open_account -> list_accounts.
// Run with: node scripts/smoke.js
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const SERVER = resolve(process.cwd(), "servers/accounts-server/dist/index.js");
const child = spawn("node", [SERVER], { stdio: ["pipe", "pipe", "inherit"] });

let buf = "";
const pending = new Map();
let id = 0;

function send(method, params) {
  const req = { jsonrpc: "2.0", id: ++id, method, params };
  pending.set(req.id, method);
  child.stdin.write(JSON.stringify(req) + "\n");
  return req.id;
}

child.stdout.on("data", (chunk) => {
  buf += chunk.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    // Skip notifications (no id) and anything we didn't request.
    if (!msg.id || !pending.has(msg.id)) continue;
    console.log(`\n=== ${pending.get(msg.id)} (#${msg.id}) ===`);
    console.log(JSON.stringify(msg.result, null, 2).slice(0, 600));
    pending.delete(msg.id);
  }
});

async function run() {
  send("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0.0.0" },
  });
  await new Promise((r) => setTimeout(r, 300));
  // notifications have no id and expect no reply
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise((r) => setTimeout(r, 200));
  send("tools/list", {});
  await new Promise((r) => setTimeout(r, 300));
  send("tools/call", {
    name: "open_account",
    arguments: {
      id: "smoke-1",
      traderName: "Smoke Tester",
      cashBalance: 100000,
      strategy: "smoke test strategy",
      riskProfile: "balanced",
    },
  });
  await new Promise((r) => setTimeout(r, 300));
  send("tools/call", { name: "list_accounts", arguments: {} });
  await new Promise((r) => setTimeout(r, 500));
  child.kill();
}

run();
