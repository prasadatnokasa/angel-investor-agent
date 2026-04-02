import { useState, useRef, useEffect } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";

// ─── Types ────────────────────────────────────────────────────────────────────

const SECTORS = [
  "CleanTech / Sustainability",
  "FinTech",
  "HealthTech",
  "EdTech",
  "D2C / Consumer",
  "SaaS / B2B",
  "AgriTech",
  "DeepTech / AI",
  "Social Commerce",
  "Logistics / Supply Chain",
] as const;

const STAGES = [
  "Idea / Pre-Revenue",
  "MVP / Early Traction",
  "Seed",
  "Pre-Series A",
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="typing-dots">
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  );
}

function MessageBubble({
  role,
  parts,
}: {
  role: string;
  parts: Array<{ type: string; text?: string }>;
}) {
  const text = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  if (!text) return null;

  if (role === "user") {
    return (
      <div className="msg-user">
        <div className="msg-user-label">YOUR REQUEST</div>
        <div className="msg-user-text">{text}</div>
      </div>
    );
  }

  // Render assistant markdown-lite: bold headers
  const formatted = text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <div key={i} className="section-header">
            {line.replace("## ", "")}
          </div>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <div key={i} className="sub-header">
            {line.replace("### ", "")}
          </div>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div key={i} className="bold-line">
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} className="spacer" />;
      return (
        <div key={i} className="body-line">
          {line}
        </div>
      );
    });

  return <div className="msg-assistant">{formatted}</div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Connect to the Cloudflare Agent via WebSocket
  const agent = useAgent({ agent: "AngelInvestorAgent" });
  const { messages, sendMessage, status, clearHistory } = useAgentChat({
    agent,
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleResearch = () => {
    if (!sector || !stage || isLoading) return;

    const prompt = `Find angel investors in India for my startup:

Sector: ${sector}
Stage: ${stage}
Location: ${location || "Bengaluru (open to pan-India investors)"}
About: ${description || "Early-stage startup looking for seed capital"}

Please search comprehensively and provide a full investor research report with specific names, funds, syndicates, platforms, and outreach strategies.`;

    setHasSearched(true);
    sendMessage(prompt);
  };

  const handleReset = () => {
    clearHistory();
    setHasSearched(false);
    setSector("");
    setStage("");
    setLocation("");
    setDescription("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;500&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #D4A853;
          --gold-dim: rgba(212,168,83,0.15);
          --gold-border: rgba(212,168,83,0.2);
          --bg: #0D0E0F;
          --surface: rgba(255,255,255,0.025);
          --text: #E8DCC8;
          --text-dim: rgba(232,220,200,0.5);
          --mono: 'IBM Plex Mono', monospace;
          --serif: 'Crimson Pro', Georgia, serif;
          --display: 'Playfair Display', serif;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--serif); }

        @keyframes pulse-dot { 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes grid-scroll { 0%{transform:translateY(0)} 100%{transform:translateY(40px)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* Grid background */
        .grid-bg {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(var(--gold-dim) 1px, transparent 1px),
            linear-gradient(90deg, var(--gold-dim) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: .6;
        }

        /* Layout */
        .root { min-height: 100vh; position: relative; display: flex; flex-direction: column; }

        /* Header */
        .header {
          border-bottom: 1px solid var(--gold-border);
          padding: 16px 32px;
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative; z-index: 1;
          background: rgba(13,14,15,.8);
          backdrop-filter: blur(8px);
          position: sticky; top: 0;
        }
        .badge {
          font-family: var(--mono); font-size: 10px; color: var(--gold);
          background: var(--gold-dim); border: 1px solid var(--gold-border);
          padding: 3px 8px; letter-spacing: 2px; text-transform: uppercase;
        }
        .header-title { font-family: var(--display); font-size: 18px; font-weight: 700; color: #F0E6D0; }
        .header-live {
          margin-left: auto; font-family: var(--mono); font-size: 10px;
          color: rgba(212,168,83,.5); letter-spacing: 1px;
          display: flex; align-items: center; gap: 6px;
        }
        .header-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--gold);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        /* Main */
        .main { max-width: 820px; margin: 0 auto; padding: 48px 24px 80px; position: relative; z-index: 1; width: 100%; }

        /* Hero */
        .eyebrow { font-family: var(--mono); font-size: 11px; color: var(--gold); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
        .title { font-family: var(--display); font-size: clamp(34px,5vw,56px); font-weight: 900; line-height: 1.08; margin-bottom: 14px; color: #F0E6D0; }
        .title em {
          font-style: italic;
          background: linear-gradient(135deg,#D4A853,#F0C860,#B8863A);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
        .subtitle { font-size: 17px; color: var(--text-dim); line-height: 1.6; margin-bottom: 40px; font-weight: 300; }

        /* Stats */
        .stats { display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 40px; }
        .stat { border-left: 2px solid rgba(212,168,83,.3); padding-left: 12px; }
        .stat-num { font-family: var(--display); font-size: 22px; font-weight: 700; color: var(--gold); }
        .stat-label { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; }

        hr.divider { border: none; border-top: 1px solid var(--gold-border); margin: 36px 0; }

        /* Form */
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        @media(max-width:600px) { .form-row { grid-template-columns: 1fr; } }
        .field { margin-bottom: 0; }
        .field-label { font-family: var(--mono); font-size: 10px; color: rgba(212,168,83,.8); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 7px; }
        .field-input, .field-select, .field-textarea {
          width: 100%; background: var(--surface); border: 1px solid var(--gold-border);
          color: var(--text); font-family: var(--serif); font-size: 15px;
          padding: 10px 14px; outline: none; border-radius: 2px;
          transition: border-color .2s, background .2s; -webkit-appearance: none;
        }
        .field-select option { background: #1a1a1c; color: var(--text); }
        .field-input:focus, .field-select:focus, .field-textarea:focus {
          border-color: var(--gold); background: rgba(212,168,83,.04);
        }
        .field-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

        /* Buttons */
        .btn-primary {
          width: 100%; background: var(--gold); color: #0D0E0F; border: none;
          padding: 14px 24px; font-family: var(--mono); font-size: 13px; font-weight: 500;
          letter-spacing: 2px; text-transform: uppercase; cursor: pointer;
          transition: all .2s; margin-top: 20px; border-radius: 2px;
        }
        .btn-primary:hover:not(:disabled) { background: #F0C860; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(212,168,83,.3); }
        .btn-primary:disabled { opacity: .45; cursor: not-allowed; }
        .btn-secondary {
          background: transparent; border: 1px solid var(--gold-border); color: var(--gold);
          padding: 8px 16px; font-family: var(--mono); font-size: 11px; letter-spacing: 1px;
          cursor: pointer; transition: all .2s; border-radius: 2px;
        }
        .btn-secondary:hover { background: var(--gold-dim); }

        /* Chat output */
        .chat-area { margin-top: 44px; animation: fade-up .4s ease; }
        .chat-header {
          border: 1px solid var(--gold-border); border-bottom: none;
          background: rgba(212,168,83,.06); padding: 10px 16px;
          display: flex; align-items: center; gap: 10px; border-radius: 2px 2px 0 0;
        }
        .chat-header-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: pulse-dot 2s ease-in-out infinite; }
        .chat-header-title { font-family: var(--mono); font-size: 11px; color: var(--gold); letter-spacing: 2px; text-transform: uppercase; }
        .chat-header-status { margin-left: auto; font-family: var(--mono); font-size: 10px; color: rgba(212,168,83,.5); }

        .chat-body {
          border: 1px solid var(--gold-border); border-top: none;
          padding: 24px; border-radius: 0 0 2px 2px;
          min-height: 120px;
        }

        /* Messages */
        .msg-user { margin-bottom: 28px; }
        .msg-user-label { font-family: var(--mono); font-size: 10px; color: rgba(212,168,83,.5); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
        .msg-user-text { font-size: 15px; color: var(--text-dim); font-style: italic; line-height: 1.6; white-space: pre-line; }

        .msg-assistant { animation: fade-up .3s ease; }
        .section-header {
          font-family: var(--display); font-size: 17px; font-weight: 700; color: var(--gold);
          margin-top: 24px; margin-bottom: 10px; padding-bottom: 6px;
          border-bottom: 1px solid var(--gold-border);
        }
        .sub-header { font-family: var(--display); font-size: 15px; font-weight: 600; color: #F0E6D0; margin-top: 16px; margin-bottom: 6px; }
        .bold-line { font-weight: 600; color: #F0E6D0; margin: 6px 0; font-size: 15px; }
        .body-line { font-size: 15px; color: var(--text); line-height: 1.75; margin: 2px 0; }
        .spacer { height: 8px; }

        /* Typing dots */
        .typing-dots { display: inline-flex; gap: 4px; align-items: center; margin-left: 6px; }
        .typing-dots span {
          display: block; width: 6px; height: 6px; border-radius: 50%; background: var(--gold);
          animation: pulse-dot 1.2s ease-in-out infinite;
        }

        /* Tool call indicator */
        .tool-indicator {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 11px; color: rgba(212,168,83,.6);
          padding: 8px 0; letter-spacing: .5px;
        }

        /* Done state */
        .done-row { margin-top: 24px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .done-badge {
          font-family: var(--mono); font-size: 11px; color: rgba(212,168,83,.7);
          background: var(--gold-dim); border: 1px solid var(--gold-border);
          padding: 6px 12px; border-radius: 2px; letter-spacing: .5px;
        }

        /* Thinking/streaming indicator */
        .streaming-hint {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 12px; color: rgba(212,168,83,.7);
          margin-top: 12px;
        }
      `}</style>

      <div className="root">
        <div className="grid-bg" />

        {/* Header */}
        <header className="header">
          <div className="badge">AGENT</div>
          <div className="header-title">Angel Investor Research</div>
          <div className="header-live">
            <div className="header-live-dot" />
            INDIA · LIVE DATA
          </div>
        </header>

        <main className="main">
          {/* Hero */}
          <div className="eyebrow">AI Research Agent</div>
          <h1 className="title">
            Find Your<br />
            <em>Angel Investor</em>
          </h1>
          <p className="subtitle">
            Searches live data to map the Indian angel ecosystem for your startup —
            specific investors, syndicates, platforms, and outreach strategies.
          </p>

          {/* Stats */}
          <div className="stats">
            {[
              { num: "5,000+", label: "Active Angels" },
              { num: "₹2,800Cr", label: "Deployed 2024" },
              { num: "40+", label: "Angel Networks" },
              { num: "12", label: "Active Sectors" },
            ].map((s) => (
              <div className="stat" key={s.label}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <hr className="divider" />

          {/* Form */}
          {!hasSearched && (
            <>
              <div className="form-row">
                <div className="field">
                  <div className="field-label">Startup Sector *</div>
                  <select
                    className="field-select"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    <option value="">Select sector...</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <div className="field-label">Current Stage *</div>
                  <select
                    className="field-select"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    <option value="">Select stage...</option>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field" style={{ marginBottom: 16 }}>
                <div className="field-label">City / Location</div>
                <input
                  className="field-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Mumbai, Delhi NCR..."
                />
              </div>

              <div className="field">
                <div className="field-label">About Your Startup</div>
                <textarea
                  className="field-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What you do, your traction, how much you're raising (₹), any investor preferences..."
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleResearch}
                disabled={isLoading || !sector || !stage}
              >
                ◈ LAUNCH RESEARCH AGENT
              </button>
            </>
          )}

          {/* Chat output */}
          {hasSearched && (
            <div className="chat-area">
              <div className="chat-header">
                <div className="chat-header-dot" />
                <div className="chat-header-title">
                  {isLoading ? "Agent Researching" : "Research Complete"}
                </div>
                <div className="chat-header-status">
                  {sector} · {stage}
                </div>
              </div>

              <div className="chat-body">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    parts={msg.parts as any}
                  />
                ))}

                {isLoading && (
                  <div className="streaming-hint">
                    <span>Searching and analysing</span>
                    <TypingDots />
                  </div>
                )}

                {!isLoading && messages.length > 0 && (
                  <div className="done-row">
                    <div className="done-badge">
                      ✓ REPORT COMPLETE · {new Date().toLocaleTimeString("en-IN")}
                    </div>
                    <button className="btn-secondary" onClick={handleReset}>
                      ↺ New Search
                    </button>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
