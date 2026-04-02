# Angel Investor Research Agent

AI-powered angel investor research for Indian startups, hosted on Cloudflare Workers with the Agents SDK.

---

## What This Does

When you enter your startup details and click **Launch Research Agent**, it:
1. Connects to a Cloudflare Worker via WebSocket
2. Claude searches the web 4–6 times for relevant angel investors in India
3. Streams back a full report with investor profiles, syndicates, platforms, and outreach strategy
4. Conversation history is automatically saved in SQLite (you can resume where you left off)

---

## Setup — Step by Step

### 1. Prerequisites

Make sure you have these installed:
- **Node.js 20+** → https://nodejs.org
- A **Cloudflare account** (free) → https://cloudflare.com
- An **Anthropic API key** → https://console.anthropic.com
- A **Brave Search API key** (free tier: 2,000 searches/month) → https://brave.com/search/api

---

### 2. Install Dependencies

Open Terminal, navigate to this folder, then run:

```bash
npm install
```

---

### 3. Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser window. Log in with your Cloudflare account.

---

### 4. Set Your API Keys as Secrets

Run these commands one at a time (you'll be prompted to paste the key):

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```
```bash
npx wrangler secret put BRAVE_API_KEY
```

> ⚠️ Never put your API keys directly in code or config files.

---

### 5. Run Locally (for testing)

```bash
npm run dev
```

Open http://localhost:5173 — the agent will be running locally.

---

### 6. Deploy to Cloudflare

```bash
npm run deploy
```

Your agent will be live at:
`https://angel-investor-agent.<your-subdomain>.workers.dev`

---

## Updating the Agent

To change the system prompt or search behaviour, edit `src/server.ts`.

After any code change:
```bash
npm run deploy
```

---

## Adding More Sectors or Stages

Edit the `SECTORS` and `STAGES` arrays in `src/app.tsx`.

---

## Architecture

```
Browser (React + useAgentChat)
        ↕ WebSocket
Cloudflare Worker
    └── AngelInvestorAgent (Durable Object)
            ├── SQLite (message history)
            ├── Claude claude-sonnet-4-20250514 (@ai-sdk/anthropic)
            └── webSearch tool → Brave Search API
```

- **`src/server.ts`** — The agent logic (Claude model, search tool, system prompt)
- **`src/app.tsx`** — The React frontend (form UI, chat display)
- **`wrangler.jsonc`** — Cloudflare configuration
- **`vite.config.ts`** — Build configuration

---

## Troubleshooting

**"Missing ANTHROPIC_API_KEY"** → Run step 4 above again.

**"Brave Search returning no results"** → Check your Brave API key is correct and the free tier limit hasn't been hit.

**"Durable Objects not available"** → Make sure your Cloudflare account has Durable Objects enabled (free, but requires a verified email).

**CORS errors locally** → Make sure you're accessing via http://localhost:5173, not a different port.
