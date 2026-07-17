// Smoke test for push-server (no Pushover creds → logs locally).
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const SERVER = resolve(process.cwd(), "servers/push-server/dist/index.js");
const child = spawn("node", [SERVER], { stdio: ["pipe", "pipe", "inherit"] });
let buf = ""; let id = 0;
const send = (m, p) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: ++id, method: m, params: p }) + "\n");
child.stdout.on("data", (d) => {
  buf += d; let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    if (msg.id) console.log(`#${msg.id}`, JSON.stringify(msg.result?.content?.[0]?.text || msg.error || "ok").slice(0, 300));
  }
});
(async () => {
  send("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
  await new Promise(r => setTimeout(r, 200));
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  await new Promise(r => setTimeout(r, 150));
  send("tools/list", {});
  await new Promise(r => setTimeout(r, 200));
  send("tools/call", { name: "push", arguments: { message: "smoke test from Phase 4" } });
  await new Promise(r => setTimeout(r, 300));
  child.kill();
})();
