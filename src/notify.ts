/**
 * Send alerts to OpenClaw (or a webhook) so they appear in WhatsApp/Telegram/Discord.
 * Uses OpenClaw CLI when OPENCLAW_ALERT_TARGET is set; otherwise ALERT_WEBHOOK_URL (e.g. Discord).
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface Alert {
  title: string;
  body: string;
  severity?: "info" | "warning" | "critical";
  /** Optional link (e.g. Solscan) */
  link?: string;
}

function formatMessage(alert: Alert): string {
  const prefix = alert.severity === "critical" ? "🚨 " : alert.severity === "warning" ? "⚠️ " : "📌 ";
  let msg = `${prefix}**${alert.title}**\n\n${alert.body}`;
  if (alert.link) msg += `\n\n${alert.link}`;
  return msg;
}

/**
 * Send via OpenClaw CLI: openclaw message send --target <channel/recipient> --message "..."
 * Target format depends on channel (e.g. Telegram chat id, phone number for WhatsApp).
 * Requires OpenClaw gateway running and openclaw in PATH.
 */
export async function sendViaOpenClaw(alert: Alert): Promise<boolean> {
  const target = process.env.OPENCLAW_ALERT_TARGET;
  if (!target) return false;

  const message = formatMessage(alert);
  // Escape for shell: single-quote message and escape single quotes inside
  const escaped = message.replace(/'/g, "'\"'\"'");
  const cmd = `openclaw message send --target "${target}" --message '${escaped}'`;

  try {
    const { stderr } = await execAsync(cmd, { timeout: 15_000 });
    if (stderr) console.warn("[openclaw] stderr:", stderr);
    return true;
  } catch (err) {
    console.error("[openclaw] send failed:", err);
    return false;
  }
}

/**
 * Send to a generic webhook (e.g. Discord, Slack) for testing without OpenClaw.
 */
export async function sendViaWebhook(alert: Alert): Promise<boolean> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return false;

  const message = formatMessage(alert);
  const body = JSON.stringify({
    content: message,
    username: "On-Chain Sentry",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error("[webhook] send failed:", err);
    return false;
  }
}

export async function sendAlert(alert: Alert): Promise<void> {
  const viaOpenClaw = await sendViaOpenClaw(alert);
  const viaWebhook = await sendViaWebhook(alert);
  if (!viaOpenClaw && !viaWebhook) {
    console.log("[sentry] No OPENCLAW_ALERT_TARGET or ALERT_WEBHOOK_URL set; alert logged only:");
    console.log(formatMessage(alert));
  }
}
