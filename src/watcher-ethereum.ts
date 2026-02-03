/**
 * Watch Ethereum (EVM) for activity and emit alerts.
 * - If WATCH_ADDRESS_ETH is set: watch new blocks for txs to/from that address.
 * - Otherwise: watch block number and alert on big jumps (reorg/catch-up).
 */

import { JsonRpcProvider } from "ethers";
import { sendAlert } from "./notify.js";

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 15_000;
const BLOCK_JUMP_THRESHOLD = Number(process.env.ETH_BLOCK_JUMP_THRESHOLD) || 20;
const EXPLORER_TX = process.env.ETH_EXPLORER_TX || "https://etherscan.io/tx";
const EXPLORER_BLOCK = process.env.ETH_EXPLORER_BLOCK || "https://etherscan.io/block";
const CHAIN_NAME = process.env.ETH_CHAIN_NAME || "Ethereum";

let lastBlockNumber = 0;
let lastSeenTxHash: string | null = null;

function normalizeAddress(a: string): string {
  return a?.toLowerCase() ?? "";
}

export function startEthereumWatcher(provider: JsonRpcProvider): void {
  const watchAddress = process.env.WATCH_ADDRESS_ETH;
  if (watchAddress) {
    watchAddressActivity(provider, normalizeAddress(watchAddress));
  } else {
    watchBlockHeight(provider);
  }
}

async function watchAddressActivity(provider: JsonRpcProvider, address: string): Promise<void> {
  console.log(`[sentry][evm] ${CHAIN_NAME} watching address:`, address);

  const poll = async () => {
    try {
      const blockNumber = await provider.getBlockNumber();
      if (lastBlockNumber === 0) {
        lastBlockNumber = blockNumber;
        return;
      }

      // Scan new blocks for txs involving the address
      for (let b = lastBlockNumber + 1; b <= blockNumber; b++) {
        const block = await provider.getBlock(b, true);
        if (!block?.prefetchedTransactions?.length) {
          lastBlockNumber = b;
          continue;
        }

        for (const tx of block.prefetchedTransactions) {
          const from = normalizeAddress(tx.from ?? "");
          const to = normalizeAddress(tx.to ?? "");
          if (from !== address && to !== address) continue;

          if (lastSeenTxHash === null) {
            lastSeenTxHash = tx.hash;
            break; // seed: don't alert on first run
          }
          if (tx.hash === lastSeenTxHash) continue;

          lastSeenTxHash = tx.hash;
          const valueWei = tx.value;
          const valueEth = valueWei ? (Number(valueWei) / 1e18).toFixed(4) : "0";
          const direction = from === address ? "out" : "in";

          await sendAlert({
            title: `${CHAIN_NAME}: activity on watched address`,
            body: `Tx: \`${tx.hash.slice(0, 18)}...\`\nBlock: ${b}\nDirection: ${direction}\nValue: ${valueEth} ETH`,
            severity: "info",
            link: `${EXPLORER_TX}/${tx.hash}`,
          });
        }
        lastBlockNumber = b;
      }
    } catch (e) {
      console.error("[sentry][eth] poll error:", e);
    }
  };

  poll();
  setInterval(poll, POLL_INTERVAL_MS);
}

async function watchBlockHeight(provider: JsonRpcProvider): Promise<void> {
  console.log(`[sentry][evm] ${CHAIN_NAME} watching block height (no WATCH_ADDRESS_ETH). Set WATCH_ADDRESS_ETH for per-account alerts.`);

  const poll = async () => {
    try {
      const blockNumber = await provider.getBlockNumber();
      if (lastBlockNumber === 0) {
        lastBlockNumber = blockNumber;
        return;
      }
      if (blockNumber <= lastBlockNumber) return;

      const delta = blockNumber - lastBlockNumber;
      lastBlockNumber = blockNumber;

      if (delta > BLOCK_JUMP_THRESHOLD) {
        await sendAlert({
          title: `${CHAIN_NAME}: block jump`,
          body: `Block advanced by ${delta} (${blockNumber - delta} → ${blockNumber}). Possible chain catch-up or reorg.`,
          severity: "info",
          link: `${EXPLORER_BLOCK}/${blockNumber}`,
        });
      }
    } catch (e) {
      console.error("[sentry][eth] poll error:", e);
    }
  };

  poll();
  setInterval(poll, POLL_INTERVAL_MS);
}
