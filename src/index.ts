#!/usr/bin/env node
/**
 * On-Chain Sentry — watch Solana + Ethereum and alert via OpenClaw (WhatsApp, Telegram, Discord, etc.)
 *
 * Chains:
 *   - Solana: RPC_URL, optional WATCH_ADDRESS
 *   - Ethereum (EVM): RPC_URL_ETH, optional WATCH_ADDRESS_ETH
 *
 * Run: npm start  or  node dist/index.js
 */

import "dotenv/config";
import { Connection } from "@solana/web3.js";
import { JsonRpcProvider } from "ethers";
import { startWatcher } from "./watcher.js";
import { startEthereumWatcher } from "./watcher-ethereum.js";
import { sendAlert } from "./notify.js";

const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const RPC_URL_ETH = process.env.RPC_URL_ETH;

function main() {
  const chains: string[] = [];

  console.log("[sentry] On-Chain Sentry started");
  console.log("[sentry] OpenClaw target:", process.env.OPENCLAW_ALERT_TARGET ? "set" : "not set");
  console.log("[sentry] Webhook:", process.env.ALERT_WEBHOOK_URL ? "set" : "not set");

  // Solana
  const connection = new Connection(RPC_URL);
  console.log("[sentry] Solana RPC:", RPC_URL);
  chains.push(`Solana: ${process.env.WATCH_ADDRESS || "slot height"}`);
  startWatcher(connection);

  // Ethereum (EVM) — optional
  if (RPC_URL_ETH) {
    const provider = new JsonRpcProvider(RPC_URL_ETH);
    console.log("[sentry] Ethereum RPC:", RPC_URL_ETH);
    chains.push(`Ethereum: ${process.env.WATCH_ADDRESS_ETH || "block height"}`);
    startEthereumWatcher(provider);
  }

  if (process.env.OPENCLAW_ALERT_TARGET || process.env.ALERT_WEBHOOK_URL) {
    sendAlert({
      title: "On-Chain Sentry started",
      body: `Chains: ${chains.join(" | ")}`,
      severity: "info",
    }).catch(() => {});
  }
}

main();
