#!/usr/bin/env node
/**
 * On-Chain Sentry — watch Solana and alert via OpenClaw (WhatsApp, Telegram, Discord, etc.)
 *
 * Prerequisites:
 *   - RPC_URL (default: devnet)
 *   - Optional: OPENCLAW_ALERT_TARGET (e.g. Telegram chat id) + OpenClaw gateway running
 *   - Optional: ALERT_WEBHOOK_URL (Discord/Slack webhook) for testing
 *   - Optional: WATCH_ADDRESS (Solana address to watch for transactions)
 *
 * Run: npm start  or  npx tsx src/index.ts
 */

import "dotenv/config";
import { Connection } from "@solana/web3.js";
import { startWatcher } from "./watcher.js";
import { sendAlert } from "./notify.js";

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";

function main() {
  const connection = new Connection(RPC_URL);

  console.log("[sentry] On-Chain Sentry started");
  console.log("[sentry] RPC:", RPC_URL);
  console.log("[sentry] OpenClaw target:", process.env.OPENCLAW_ALERT_TARGET ? "set" : "not set");
  console.log("[sentry] Webhook:", process.env.ALERT_WEBHOOK_URL ? "set" : "not set");

  // Send a startup ping so you know the sentry is live (only if some output is configured)
  if (process.env.OPENCLAW_ALERT_TARGET || process.env.ALERT_WEBHOOK_URL) {
    sendAlert({
      title: "On-Chain Sentry started",
      body: `RPC: ${RPC_URL}\nWatching: ${process.env.WATCH_ADDRESS || "slot height"}`,
      severity: "info",
    }).catch(() => {});
  }

  startWatcher(connection);
}

main();
