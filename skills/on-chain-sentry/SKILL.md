# On-Chain Sentry Skill

Use this skill when the user asks about **on-chain sentry**, **Solana/Ethereum alerts**, **watched addresses**, or **chain monitoring**.

## What the On-Chain Sentry does

- **Watches Solana**: Either a specific address (`WATCH_ADDRESS`) for every transaction, or slot height for large jumps (reorg/catch-up).
- **Watches Ethereum (EVM)** (optional): Set `RPC_URL_ETH` to enable. Either a specific address (`WATCH_ADDRESS_ETH`) for in/out txs, or block number for large jumps. Works with any EVM chain (Ethereum, Base, Arbitrum, etc.).
- **Sends alerts** via OpenClaw (WhatsApp, Telegram, Discord, etc.) when:
  - A transaction touches a watched address (Solana or Ethereum), or
  - Slot/block advances by more than the configured threshold (default 20).

## How to run it

From the project root (`openclaw/on-chain-sentry`):

```bash
cp .env.example .env
# Edit .env: OPENCLAW_ALERT_TARGET; optionally RPC_URL_ETH and WATCH_ADDRESS_ETH for Ethereum
npm install && npm start
```

The sentry runs as a long-lived process. Alerts appear in the channel configured as `OPENCLAW_ALERT_TARGET`.

## Configuration (env)

| Variable | Description |
|----------|-------------|
| `RPC_URL` | Solana RPC (default: devnet). Use Helius/QuickNode for mainnet. |
| `WATCH_ADDRESS` | Optional. Solana address to watch; if unset, only slot jumps are reported. |
| `RPC_URL_ETH` | Optional. Ethereum/EVM RPC to enable Ethereum (e.g. mainnet, Base, Arbitrum). |
| `WATCH_ADDRESS_ETH` | Optional. Ethereum address (0x...) to watch; if unset, only block jumps are reported. |
| `OPENCLAW_ALERT_TARGET` | OpenClaw recipient (e.g. Telegram chat id). Required for OpenClaw delivery. |
| `ALERT_WEBHOOK_URL` | Optional. Discord/Slack webhook for testing without OpenClaw. |
| `POLL_INTERVAL_MS` | Poll interval in ms (default: 15000). |
| `SLOT_JUMP_THRESHOLD` | Solana slot jump threshold (default: 20). |
| `ETH_BLOCK_JUMP_THRESHOLD` | Ethereum block jump threshold (default: 20). |

## What you can ask the agent

- "What is the on-chain sentry?"
- "How do I add a watched address (Solana or Ethereum)?"
- "How do I watch Base or Arbitrum?" (Set `RPC_URL_ETH=https://mainnet.base.org` and `ETH_EXPLORER_TX=https://basescan.org/tx`.)
- "Why did I get a slot/block jump alert?"
- "How do I run the sentry in the background?"

Direct the user to the project README and the env vars above.
