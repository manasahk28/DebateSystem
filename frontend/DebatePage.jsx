import { useState, useEffect, useRef } from "react";

// ── replace with your actual constants if integrating ─────────────────────────
const API = "http://localhost:8000";

// ── shared theme (mirrors Debate2.jsx / HomePage.jsx / HistoryPage.jsx) ───────
function useTheme() {
  const [dark, setDark] = useState(false);
  const theme = {
    dark,
    bg:           dark ? "#0d0d1a"                           : "#ede8f5",
    card:         dark ? "#13101f"                           : "#f5f2fc",
    text:         dark ? "#e8e0f5"                           : "#1e1240",
    subtext:      dark ? "#9987cc"                           : "#5b4a8a",
    muted:        dark ? "#6b5fa0"                           : "#8b7cb5",
    accent:       dark ? "#a78bfa"                           : "#7c5cbf",
    border:       dark ? "#2a1f50"                           : "#d4c8ef",
    rowBg:        dark ? "#13101f"                           : "#ffffff",
    rowBorder:    dark ? "#2d2060"                           : "#ddd6f5",
    btnBg:        dark ? "#1e1535"                           : "#eee9f9",
    btnText:      dark ? "#a78bfa"                           : "#7c5cbf",
    btnBorder:    dark ? "#2d2060"                           : "#d4c8ef",
    proBg:        dark ? "rgba(52,211,153,0.08)"             : "rgba(52,211,153,0.10)",
    proBorder:    dark ? "rgba(52,211,153,0.25)"             : "rgba(16,185,129,0.30)",
    proText:      dark ? "#34d399"                           : "#059669",
    conBg:        dark ? "rgba(248,113,113,0.08)"            : "rgba(248,113,113,0.10)",
    conBorder:    dark ? "rgba(248,113,113,0.25)"            : "rgba(239,68,68,0.30)",
    conText:      dark ? "#f87171"                           : "#dc2626",
    factBg:       dark ? "rgba(167,139,250,0.08)"            : "rgba(124,92,191,0.07)",
    factBorder:   dark ? "rgba(167,139,250,0.25)"            : "rgba(124,92,191,0.20)",
    factText:     dark ? "#a78bfa"                           : "#7c5cbf",
    judgeBg:      dark ? "rgba(251,191,36,0.08)"             : "rgba(251,191,36,0.10)",
    judgeBorder:  dark ? "rgba(251,191,36,0.25)"             : "rgba(217,119,6,0.25)",
    judgeText:    dark ? "#fbbf24"                           : "#d97706",
    danger:       dark ? "#f87171"                           : "#dc2626",
    dangerBg:     dark ? "rgba(248,113,113,0.08)"            : "rgba(254,226,226,1)",
    dangerBorder: dark ? "rgba(248,113,113,0.25)"            : "rgba(252,165,165,1)",
    success:      dark ? "#34d399"                           : "#059669",
    statBg:       dark ? "#1a1330"                           : "#eee9f9",
    cardShadow:   dark ? "0 8px 40px rgba(109,40,217,0.18)" : "0 8px 40px rgba(124,92,191,0.10)",
  };
  return { theme, toggleDark: () => setDark(d => !d) };
}

// ── navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ theme, toggleDark }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "18px 28px",
      borderBottom: `1px solid ${theme.border}`,
      background: theme.card,
      transition: "background 0.35s, border-color 0.35s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          fontFamily: "'Georgia', serif", fontSize: "22px",
          fontWeight: "700", color: theme.text, letterSpacing: "-0.4px",
        }}>
          Debate2.0
        </span>
        {theme.dark && (
          <span style={{ color: "#a78bfa", fontSize: 12, marginTop: "-8px" }}>✦</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div onClick={toggleDark} style={{
          width: "46px", height: "26px",
          background: theme.dark ? "#6d28d9" : "#c4b5fd",
          borderRadius: "13px", position: "relative",
          cursor: "pointer", transition: "background 0.3s",
        }}>
          <div style={{
            position: "absolute", top: "3px",
            left: theme.dark ? "23px" : "3px",
            width: "20px", height: "20px",
            background: "#fff", borderRadius: "50%",
            transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }} />
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, theme }) {
  return (
    <div style={{
      flex: 1, padding: "12px 14px",
      background: theme.statBg,
      border: `1px solid ${theme.border}`,
      borderRadius: "12px",
      textAlign: "center",
      transition: "background 0.35s",
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.accent, marginBottom: 3 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: theme.muted, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ── turn card ──────────────────────────────────────────────────────────────────
function TurnCard({ msg, index, isNew, theme }) {
  const speakerStyles = {
    pro:        { bg: theme.proBg,    border: theme.proBorder,    text: theme.proText,   label: "PRO" },
    con:        { bg: theme.conBg,    border: theme.conBorder,    text: theme.conText,   label: "CON" },
    fact_check: { bg: theme.factBg,   border: theme.factBorder,   text: theme.factText,  label: "FACT CHECK" },
    judge:      { bg: theme.judgeBg,  border: theme.judgeBorder,  text: theme.judgeText, label: "JUDGE" },
  };
  const s = speakerStyles[msg.speaker] || speakerStyles.fact_check;

  return (
    <div style={{
      padding: "16px 18px",
      borderBottom: `1px solid ${theme.border}`,
      background: s.bg,
      borderLeft: `3px solid ${s.border}`,
      animation: isNew ? "fadeSlide 0.4s ease" : "none",
      transition: "background 0.35s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          padding: "3px 8px", borderRadius: 5,
          background: s.border, color: s.text,
        }}>
          {s.label}
        </span>
        {msg.round != null && (
          <span style={{ fontSize: 11, color: theme.muted }}>Round {msg.round}</span>
        )}
      </div>
      <div style={{
        fontSize: 14, lineHeight: 1.7, color: theme.text,
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

// ── winner banner ──────────────────────────────────────────────────────────────
function WinnerBanner({ winner, disqualified, theme }) {
  const map = {
    pro:  { emoji: "🏆", label: "PRO WINS",  color: theme.proText,   bg: theme.proBg,   border: theme.proBorder },
    con:  { emoji: "🏆", label: "CON WINS",  color: theme.conText,   bg: theme.conBg,   border: theme.conBorder },
    draw: { emoji: "🤝", label: "DRAW",       color: theme.accent,    bg: theme.factBg,  border: theme.factBorder },
  };
  const w = map[winner] || map.draw;

  return (
    <div style={{
      marginTop: 28,
      padding: "20px 24px",
      borderRadius: "14px",
      background: w.bg,
      border: `1px solid ${w.border}`,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <span style={{ fontSize: 28 }}>{w.emoji}</span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: w.color, letterSpacing: "0.04em" }}>
          {w.label}
        </div>
        {disqualified && (
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
            {disqualified.toUpperCase()} was disqualified
          </div>
        )}
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
export default function DebatePage({ topic, onDone, onBack }) {
  const { theme, toggleDark }             = useTheme();
  const [messages, setMessages]           = useState([]);
  const [status, setStatus]               = useState("connecting");
  const [winner, setWinner]               = useState(null);
  const [disqualified, setDisqualified]   = useState(null);
  const [stats, setStats]                 = useState({ rounds: 0, total: 0 });
  const [newIndices, setNewIndices]       = useState(new Set());
  const [debateId, setDebateId]           = useState(null);
  const [backHovered, setBackHovered]     = useState(false);
  const [exportHovered, setExportHovered] = useState(false);
  const [jsonHovered, setJsonHovered]     = useState(false);
  const bottomRef = useRef(null);

  // ── SSE stream ──
  useEffect(() => {
    let aborted = false;
    async function startStream() {
      try {
        const res = await fetch(`${API}/debate/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        if (!res.ok) { setStatus("error"); return; }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";
        setStatus("running");

        while (true) {
          const { value, done } = await reader.read();
          if (done || aborted) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const evt = JSON.parse(raw);
              if (aborted) break;
              if (evt.type === "started") {
                setDebateId(evt.debate_id);
              } else if (evt.type === "turn") {
                setMessages(prev => {
                  const idx = prev.length;
                  setNewIndices(s => new Set([...s, idx]));
                  setTimeout(() => {
                    setNewIndices(s => { const n = new Set(s); n.delete(idx); return n; });
                  }, 500);
                  return [...prev, evt];
                });
              } else if (evt.type === "done") {
                setWinner(evt.winner);
                setDisqualified(evt.disqualified);
                setStats({ rounds: evt.total_rounds, total: evt.total_messages });
                setStatus("done");
                onDone && onDone(evt);
              } else if (evt.type === "error") {
                setStatus("error");
              }
            } catch (e) { console.warn("SSE parse error:", e); }
          }
        }
        if (!aborted) setStatus(prev => prev === "running" ? "done" : prev);
      } catch (e) {
        console.error("Stream error:", e);
        if (!aborted) setStatus("error");
      }
    }
    startStream();
    return () => { aborted = true; };
  }, [topic]);

  // ── auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const proMsgs = messages.filter(m => m.speaker === "pro").length;
  const conMsgs = messages.filter(m => m.speaker === "con").length;

  const linkStyle = (hovered) => ({
    fontSize: 13, fontWeight: 600,
    padding: "9px 18px",
    border: `1px solid ${hovered ? theme.accent : theme.btnBorder}`,
    borderRadius: "10px",
    textDecoration: "none",
    color: hovered ? "#fff" : theme.btnText,
    background: hovered ? theme.accent : theme.btnBg,
    transition: "all 0.18s",
    display: "inline-block",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      transition: "background 0.35s",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
      `}</style>

      <Navbar theme={theme} toggleDark={toggleDark} />

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px 64px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 28 }}>
          <button
            onClick={onBack}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              flexShrink: 0, marginTop: 3, padding: "6px 12px", fontSize: 13,
              border: `1px solid ${backHovered ? theme.accent : theme.btnBorder}`,
              borderRadius: 8, background: "transparent",
              color: backHovered ? theme.accent : theme.muted,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            ← back
          </button>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
              textTransform: "uppercase", color: theme.muted, marginBottom: 5,
            }}>
              Debate Topic
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, color: theme.text }}>
              {topic}
            </div>
          </div>

          {/* Status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 4 }}>
            {status === "running" && (
              <>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: theme.accent,
                  animation: "pulse 1.2s ease infinite",
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.accent }}>live</span>
              </>
            )}
            {status === "done" && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px",
                borderRadius: 20, background: theme.proBg,
                color: theme.success, border: `1px solid ${theme.proBorder}`,
                letterSpacing: "0.05em",
              }}>
                concluded
              </span>
            )}
            {status === "error" && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px",
                borderRadius: 20, background: theme.dangerBg,
                color: theme.danger, border: `1px solid ${theme.dangerBorder}`,
                letterSpacing: "0.05em",
              }}>
                error
              </span>
            )}
            {status === "connecting" && (
              <span style={{ fontSize: 12, color: theme.muted }}>connecting…</span>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <StatCard label="Rounds"    value={stats.rounds    || "—"} theme={theme} />
          <StatCard label="PRO turns" value={proMsgs         || "—"} theme={theme} />
          <StatCard label="CON turns" value={conMsgs         || "—"} theme={theme} />
          <StatCard label="Messages"  value={messages.length || "—"} theme={theme} />
        </div>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 0 }}>
          <div style={{ flex: 1, height: "1px", background: theme.border }} />
          <span style={{ color: theme.accent, fontSize: 14 }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: theme.border }} />
        </div>

        {/* ── Turn feed ── */}
        <div style={{
          borderRadius: "0 0 14px 14px",
          overflow: "hidden",
          border: `1px solid ${theme.border}`,
          borderTop: "none",
          marginBottom: 0,
        }}>
          {messages.length === 0 && status === "running" && (
            <div style={{
              padding: "40px 24px", textAlign: "center",
              color: theme.muted, fontSize: 14,
              background: theme.rowBg,
            }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>⚡</div>
              Agents are preparing their positions…
            </div>
          )}
          {messages.map((msg, i) => (
            <TurnCard key={i} msg={msg} index={i} isNew={newIndices.has(i)} theme={theme} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Winner banner ── */}
        {status === "done" && winner && (
          <WinnerBanner winner={winner} disqualified={disqualified} theme={theme} />
        )}

        {/* ── Error banner ── */}
        {status === "error" && (
          <div style={{
            marginTop: 24, padding: "16px 20px", borderRadius: "12px",
            background: theme.dangerBg,
            border: `1px solid ${theme.dangerBorder}`,
            color: theme.danger, fontSize: 14, lineHeight: 1.6,
          }}>
            Something went wrong. Check that the API server is running at{" "}
            <code style={{ fontFamily: "monospace" }}>{API}</code>.
          </div>
        )}

        {/* ── Export links ── */}
        {status === "done" && debateId && (
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <a
              href={`${API}/debate/${debateId}/export`}
              target="_blank" rel="noreferrer"
              onMouseEnter={() => setExportHovered(true)}
              onMouseLeave={() => setExportHovered(false)}
              style={linkStyle(exportHovered)}
            >
              Export CSV
            </a>
            <a
              href={`${API}/debate/${debateId}/transcript`}
              target="_blank" rel="noreferrer"
              onMouseEnter={() => setJsonHovered(true)}
              onMouseLeave={() => setJsonHovered(false)}
              style={linkStyle(jsonHovered)}
            >
              View JSON
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
