# On-Chain Sentry Skill

Use this skill when the user asks about **on-chain sentry**, **Solana alerts**, **watched addresses**, or **chain monitoring**.

## What the On-Chain Sentry does

- **Watches Solana**: Either a specific address (`WATCH_ADDRESS`) for every transaction, or slot height for large jumps (reorg/catch-up).
- **Sends alerts** via OpenClaw (WhatsApp, Telegram, Discord, etc.) when:
  - A transaction touches the watched address, or
  - Slot advances by more than `SLOT_JUMP_THRESHOLD` (default 20).

## How to run it

From the project root (`openclaw/on-chain-sentry`):

```bash
cp .env.example .env
# Edit .env: set OPENCLAW_ALERT_TARGET (e.g. your Telegram chat id or phone for WhatsApp)
npm install && npm start
```

The sentry runs as a long-lived process. Alerts appear in the channel configured as `OPENCLAW_ALERT_TARGET`.

## Configuration (env)

| Variable | Description |
|----------|-------------|
| `RPC_URL` | Solana RPC (default: devnet). Use Helius/QuickNode for mainnet. |
| `WATCH_ADDRESS` | Optional. Solana address to watch; if unset, only slot jumps are reported. |
| `OPENCLAW_ALERT_TARGET` | OpenClaw recipient (e.g. Telegram chat id). Required for OpenClaw delivery. |
| `ALERT_WEBHOOK_URL` | Optional. Discord/Slack webhook for testing without OpenClaw. |
| `POLL_INTERVAL_MS` | Poll interval in ms (default: 15000). |
| `SLOT_JUMP_THRESHOLD` | Alert when slot advances by more than this (default: 20). |

## What you can ask the agent

- "What is the on-chain sentry?"
- "How do I add a watched address?"
- "Why did I get a slot jump alert?"
- "How do I run the sentry in the background?"

Direct the user to the project README and the env vars above.
