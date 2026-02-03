# On-Chain Sentry (OpenClaw example)

A **working example project** that uses [OpenClaw](https://docs.clawd.bot/) to send **Solana on-chain alerts** to your chat (WhatsApp, Telegram, Discord, etc.).

## What it does

- **Watches Solana**:
  - **Address watch**: If you set `WATCH_ADDRESS`, every transaction touching that account triggers an alert with signature and Solscan link.
  - **Slot watch**: If you don’t set an address, the sentry watches slot height and alerts when it jumps by more than a threshold (e.g. reorg or catch-up).
- **Sends alerts** via:
  - **OpenClaw** (`openclaw message send`) so messages appear in your configured channel (Telegram, WhatsApp, Discord, etc.).
  - **Optional webhook** (e.g. Discord/Slack) for testing without OpenClaw.

## Prerequisites

- **Node.js 18+**
- **OpenClaw** (optional): [Install OpenClaw](https://docs.clawd.bot/install), run the gateway, and pair at least one channel (e.g. Telegram). Then set `OPENCLAW_ALERT_TARGET` to the recipient where you want alerts (e.g. your Telegram chat id).

## Quick start

```bash
cd openclaw/on-chain-sentry
cp .env.example .env
# Edit .env: set OPENCLAW_ALERT_TARGET and/or ALERT_WEBHOOK_URL
npm install
npm start
# Or after building: npm run build && node dist/index.js
```

You should see:

```
[sentry] On-Chain Sentry started
[sentry] RPC: https://api.devnet.solana.com
[sentry] OpenClaw target: set
[sentry] Watching address: <your WATCH_ADDRESS>
```

If OpenClaw or webhook is set, a startup ping is sent. New activity (or slot jumps) will trigger alerts in that channel.

## Configuration (.env)

| Variable | Description |
|----------|-------------|
| `RPC_URL` | Solana RPC URL. Default: `https://api.devnet.solana.com`. Use a mainnet RPC (e.g. Helius) for production. |
| `WATCH_ADDRESS` | Optional. Solana public key to watch; every tx touching it is alerted. |
| `OPENCLAW_ALERT_TARGET` | OpenClaw recipient (e.g. Telegram chat id). Required for delivery to OpenClaw channels. |
| `ALERT_WEBHOOK_URL` | Optional. Discord or Slack webhook URL for testing without OpenClaw. |
| `POLL_INTERVAL_MS` | Poll interval in ms (default: 15000). |
| `SLOT_JUMP_THRESHOLD` | Alert when slot advances by more than this (default: 20). |

## OpenClaw integration

1. **Install and run OpenClaw** (see [docs.clawd.bot](https://docs.clawd.bot/)).
2. **Pair a channel** (e.g. Telegram): `openclaw channels login` and complete pairing.
3. **Get your target**: For Telegram, the target is typically your chat id (e.g. from a bot or the OpenClaw UI). Set it as `OPENCLAW_ALERT_TARGET` in `.env`.
4. **Start the sentry**: `npm start`. Alerts are sent via `openclaw message send --target $OPENCLAW_ALERT_TARGET --message "..."`.

### Skill (optional)

Copy or link the skill so the OpenClaw agent can answer questions about the sentry:

```bash
# If your OpenClaw workspace is ~/clawd:
mkdir -p ~/clawd/skills/on-chain-sentry
cp -r openclaw/on-chain-sentry/skills/on-chain-sentry/* ~/clawd/skills/on-chain-sentry/
```

Then you can ask the agent: “What is the on-chain sentry?” or “How do I add a watched address?”

## Run in background

```bash
# With nohup
nohup npm start > sentry.log 2>&1 &

# Or use a process manager (pm2, systemd, etc.)
```

## Project layout

```
on-chain-sentry/
├── src/
│   ├── index.ts    # Entry: loads config, starts watcher
│   ├── watcher.ts  # Polls Solana (address or slot), emits events
│   └── notify.ts   # Sends alerts via OpenClaw CLI or webhook
├── skills/
│   └── on-chain-sentry/
│       └── SKILL.md   # OpenClaw skill for “what is sentry / how to configure”
├── .env.example
├── package.json
└── README.md
```

## License

MIT.
