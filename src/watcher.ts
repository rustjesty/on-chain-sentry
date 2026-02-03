/**
 * Watch Solana for activity and emit alerts.
 * - If WATCH_ADDRESS is set: watch getSignaturesForAddress (txs touching that account).
 * - Otherwise: watch slot height and alert on big jumps (e.g. reorg/catch-up).
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { sendAlert } from "./notify.js";
import { solscanBlockUrl, solscanTxUrl } from "./explorers.js";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 15_000;
const SLOT_JUMP_THRESHOLD = Number(process.env.SLOT_JUMP_THRESHOLD) || 20;

let lastSlot = 0;
let lastSignature: string | null = null;

export function startWatcher(connection: Connection): void {
  const watchAddress = process.env.WATCH_ADDRESS;
  if (watchAddress) {
    watchAddressActivity(connection, watchAddress);
  } else {
    watchSlotAndActivity(connection);
  }
}

async function watchAddressActivity(connection: Connection, address: string): Promise<void> {
  const pubkey = new PublicKey(address);
  console.log(`[sentry] Watching address: ${address}`);

  const poll = async () => {
    try {
      const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 5 });
      if (sigs.length === 0) return;

      const sig = sigs[0];
      if (lastSignature === null) {
        lastSignature = sig.signature;
        return; // first run: don't alert, just seed
      }
      if (sig.signature === lastSignature) return;

      lastSignature = sig.signature;
      const slot = sig.slot;
      const err = sig.err;
      const blockTime = sig.blockTime
        ? new Date(sig.blockTime * 1000).toISOString()
        : "unknown";

      await sendAlert({
        title: "Activity on watched address",
        body: `Signature: \`${sig.signature.slice(0, 16)}...\`\nSlot: ${slot}\nTime: ${blockTime}${err ? `\nStatus: failed` : ""}`,
        severity: err ? "warning" : "info",
        link: solscanTxUrl(sig.signature),
      });
    } catch (e) {
      console.error("[sentry] poll error:", e);
    }
  };

  await poll();
  setInterval(poll, POLL_INTERVAL_MS);
}

async function watchSlotAndActivity(connection: Connection): Promise<void> {
  console.log("[sentry] Watching slot height (no WATCH_ADDRESS). Set WATCH_ADDRESS for per-account alerts.");

  const poll = async () => {
    try {
      const slot = await connection.getSlot();
      if (lastSlot === 0) {
        lastSlot = slot;
        return;
      }
      if (slot <= lastSlot) return;

      const delta = slot - lastSlot;
      lastSlot = slot;

      if (delta > SLOT_JUMP_THRESHOLD) {
        await sendAlert({
          title: "Slot jump",
          body: `Slot advanced by ${delta} (${lastSlot - delta} → ${slot}). Possible chain catch-up or reorg.`,
          severity: "info",
          link: solscanBlockUrl(slot),
        });
      }
    } catch (e) {
      console.error("[sentry] poll error:", e);
    }
  };

  await poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
