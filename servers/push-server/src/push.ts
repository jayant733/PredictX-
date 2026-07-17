import { createLogger } from "@autonomous-traders/shared";

const log = createLogger("push-server");

/**
 * Send a message to Pushover via their REST API.
 * Uses the PUSHOVER_USER and PUSHOVER_TOKEN env vars.
 * If either is missing, the push is logged locally (no crash) —
 * useful for dev when you don't want alerts.
 *
 * Ref: https://pushover.net/api#message
 */

const PUSHOVER_URL = "https://api.pushover.net/1/messages.json";

export interface PushResult {
  sent: boolean;
  status: number;
  message: string;
}

export async function sendPush(
  message: string,
  title?: string,
): Promise<PushResult> {
  const user = process.env.PUSHOVER_USER;
  const token = process.env.PUSHOVER_TOKEN;

  if (!user || !token) {
    log.warn("PUSHOVER_USER or PUSHOVER_TOKEN not set — logging locally");
    log.info("[PUSH]", { title: title ?? "trading-floor", message });
    return { sent: false, status: 0, message: "logged locally (no Pushover credentials)" };
  }

  const form = new URLSearchParams({
    user,
    token,
    message,
    title: title ?? "Trading Floor",
  });

  const res = await fetch(PUSHOVER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const text = await res.text();
  if (res.ok) {
    log.info("push sent", { title: title ?? "trading-floor" });
    return { sent: true, status: res.status, message: text };
  }
  log.error("push failed", { status: res.status, body: text });
  return { sent: false, status: res.status, message: text };
}
