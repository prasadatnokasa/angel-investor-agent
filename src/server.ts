import { AIChatAgent } from "@cloudflare/ai-chat";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import { routeAgentRequest } from "agents";

export interface Env {
  AngelInvestorAgent: DurableObjectNamespace;
  ANTHROPIC_API_KEY: string;
  BRAVE_API_KEY: string;
  ASSETS: Fetcher;
}

const SYSTEM_PROMPT = `You are an elite startup funding research analyst specialising in the Indian angel investment ecosystem.

Your job: When given a startup profile, use the webSearch tool multiple times (4–6 searches) to build a comprehensive, actionable report on angel investors in India for that startup.

SEARCH STRATEGY — run these searches in order:
1. "angel investors India [sector] 2024 2025"
2. "Indian angel network [sector] investments [city]"  
3. "[sector] startup funding India seed round angel [year]"
4. "LetsVenture Mumbai Angels IAN [sector] active investors"
5. "angel investor India [sector] LinkedIn portfolio exits"
6. "[sector] India startup unicorn angel backer"

After searching, compile a structured report with these sections:

## 🧑‍💼 Angel Investor Profiles
For each investor: Name, background, investment thesis, typical cheque size (₹), recent bets, contact/social handle.

## 🤝 Syndicates & Networks
Active groups (Mumbai Angels, IAN, LetsVenture, Ah! Ventures, Angel Prime, etc.) that are relevant to the sector — with notes on how to apply.

## 📱 Platforms to List On
AngelList India, Tyke, 1Crowd, WFC, Tracxn, Entrackr — with sector fit notes.

## 📬 Outreach Strategy
3–5 specific, tactical steps to reach these investors. Include DM templates, warm intro routes, event suggestions.

## 📈 Recent Deal Activity
Latest investments in this sector (2024–2025) signalling investor appetite.

Be specific with real names, real deals, real numbers. Founders need actionable intelligence, not generic advice.`;

// ─── Angel Investor Research Agent ──────────────────────────────────────────

export class AngelInvestorAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const anthropic = createAnthropic({
      apiKey: this.env.ANTHROPIC_API_KEY,
    });

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      maxSteps: 10,
      tools: {
        webSearch: tool({
          description:
            "Search the web for current information about angel investors, startup funding, and investment activity in India.",
          inputSchema: z.object({
            query: z
              .string()
              .describe("The search query to look up. Be specific."),
          }),
          execute: async ({ query }) => {
            try {
              const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=6&country=in`;
              const response = await fetch(url, {
                headers: {
                  Accept: "application/json",
                  "Accept-Encoding": "gzip",
                  "X-Subscription-Token": this.env.BRAVE_API_KEY,
                },
              });

              if (!response.ok) {
                return { error: `Search failed: ${response.statusText}` };
              }

              const data = (await response.json()) as any;
              const results =
                data.web?.results?.map((r: any) => ({
                  title: r.title,
                  url: r.url,
                  description: r.description,
                  age: r.age,
                })) ?? [];

              return { query, results };
            } catch (err: any) {
              return { error: err.message };
            }
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  }
}

// ─── Worker Entry Point ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Add CORS headers for local dev
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    return (
      (await routeAgentRequest(request, env)) ??
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
