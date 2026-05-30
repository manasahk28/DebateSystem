import { useState, useEffect, useRef } from "react";
import { API } from "./constants";

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
// ── turn card ──────────────────────────────────────────────────────────────────
function TurnCard({ msg, index, isNew, theme }) {
  if (!msg) return null;

  const speaker = msg.speaker || "pro";
  const stage = msg.stage || "opening";
  const content = msg.content || "";

  if (speaker === "judge" || (speaker === "moderator" && stage === "verdict")) {
    let winner = "DRAW";
    let reason = content;
    let title = "JUDICIAL VERDICT";
    let disqualified = null;
    let isDisqualified = false;

    if (speaker === "judge") {
      const winnerMatch = content.match(/WINNER:\s*([A-Za-z]+)/i);
      if (winnerMatch) winner = winnerMatch[1].trim().toUpperCase();
      const reasonMatch = content.match(/REASON:\s*([\s\S]+)/i);
      if (reasonMatch) reason = reasonMatch[1].trim();
    } else {
      title = "MODERATOR DECISION";
      isDisqualified = true;
      const winnerMatch = content.match(/WINNER:\s*([A-Za-z]+)/i);
      if (winnerMatch) winner = winnerMatch[1].trim().toUpperCase();
      const disMatch = content.match(/DISQUALIFIED:\s*([A-Za-z]+)/i);
      if (disMatch) disqualified = disMatch[1].trim().toUpperCase();
      
      reason = "Debate ended early due to excessive factual inaccuracies. Too many failed fact checks resulted in automated disqualification.";
      const reasonMatch = content.match(/exceeded fact check limit/i);
      if (reasonMatch) {
        reason = content;
      }
    }

    const winnerColor = winner === "PRO" ? theme.proText : winner === "CON" ? theme.conText : theme.accent;
    const bannerBg = winner === "PRO" ? theme.proBg : winner === "CON" ? theme.conBg : theme.factBg;
    const borderCol = winner === "PRO" ? theme.proBorder : winner === "CON" ? theme.conBorder : theme.factBorder;

    return (
      <div style={{
        padding: "24px 28px",
        borderBottom: `1px solid ${theme.border}`,
        background: `linear-gradient(135deg, ${theme.judgeBg} 0%, rgba(251,191,36,0.02) 100%)`,
        borderLeft: `5px solid ${theme.judgeBorder}`,
        animation: isNew ? "fadeSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        transition: "all 0.35s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
            padding: "4px 10px", borderRadius: 6,
            background: theme.judgeBorder, color: theme.judgeText,
            border: `1px solid ${theme.judgeBorder}`,
            fontFamily: "monospace",
          }}>
            {title}
          </span>
          {msg.round != null && (
            <span style={{ fontSize: 11, color: theme.muted, fontWeight: 500 }}>Concluded in Round {msg.round}</span>
          )}
        </div>
        
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20,
          background: bannerBg, padding: "16px 20px", borderRadius: "12px",
          border: `1.5px solid ${borderCol}`,
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.muted, marginBottom: 4 }}>
              Decision Result
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: winnerColor, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🏆</span> {winner} WINS
            </div>
          </div>
          {isDisqualified && disqualified && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.danger, marginBottom: 4 }}>
                Infraction Details
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.danger }}>
                ⚠️ {disqualified} Disqualified
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.muted, marginBottom: 6 }}>
            Judicial Rationale & Analysis
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.75, color: theme.text,
            background: theme.rowBg, padding: "14px 18px", borderRadius: "10px",
            border: `1px solid ${theme.border}`,
            whiteSpace: "pre-wrap",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
          }}>
            {reason}
          </div>
        </div>
      </div>
    );
  }

  const speakerStyles = {
    pro:          { bg: theme.proBg,    border: theme.proBorder,    text: theme.proText,   label: "PRO" },
    con:          { bg: theme.conBg,    border: theme.conBorder,    text: theme.conText,   label: "CON" },
    fact_check:   { bg: theme.factBg,   border: theme.factBorder,   text: theme.factText,  label: "FACT CHECK" },
    fact_checker: { bg: theme.factBg,   border: theme.factBorder,   text: theme.factText,  label: "FACT CHECK" },
    judge:        { bg: theme.judgeBg,  border: theme.judgeBorder,  text: theme.judgeText, label: "JUDGE" },
    moderator:    { bg: theme.factBg,   border: theme.factBorder,   text: theme.factText,  label: "MODERATOR" },
    default:      { bg: theme.rowBg,    border: theme.border,       text: theme.text,      label: "DEBATE" },
  };
  const s = speakerStyles[speaker] || speakerStyles.default;

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
        {content}
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
export default function DebatePage({ topic, onDone, onBack, theme, userId }) {
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
    const controller = new AbortController();
    const signal = controller.signal;
    let aborted = false;

    async function startStream() {
      try {
        const res = await fetch(`${API}/debate/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, user_id: userId }),
          signal,
        });
        if (!res.ok) { setStatus("error"); return; }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";
        setStatus("running");

        while (true) {
          const { value, done } = await reader.read();
          if (done || aborted || signal.aborted) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const evt = JSON.parse(raw);
              if (aborted || signal.aborted) break;
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
                onDone && onDone(evt);
              } else if (evt.type === "complete") {
                // Backend signals stream completion; ensure UI stops loading spinners
                setStatus("done");
                aborted = true;
                break;
              } else if (evt.type === "error") {
                setStatus("error");
              }
            } catch (e) { console.warn("SSE parse error:", e); }
          }
        }
        if (!aborted && !signal.aborted) setStatus("done");
      } catch (e) {
        if (e.name === "AbortError") {
          return; // Fetch aborted cleanly, ignore
        }
        console.error("Stream error details:", e.message, e.name, e.stack);
        if (!aborted && !signal.aborted) setStatus("error");
      }
    }
    startStream();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [topic, userId]);

  // ── auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const proMsgs = messages.filter(m => m?.speaker === "pro").length;
  const conMsgs = messages.filter(m => m?.speaker === "con").length;

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

  const sortedMessages = [...messages].sort(
    (a, b) => (a.turn_number || 0) - (b.turn_number || 0)
  );

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
          {sortedMessages.map((msg, i) => (
            <TurnCard key={`${msg?.speaker || "unknown"}-${msg?.turn_number || i}`} msg={msg} index={i} isNew={newIndices.has(i)} theme={theme} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Winner banner ── */}
        {status === "done" && winner && (
          <WinnerBanner winner={winner} disqualified={disqualified} theme={theme} />
        )}

        {/* ── Decision Rationale Card ── */}
        {status === "done" && (
          (() => {
            const finalVerdictMsg = sortedMessages.find(m => m?.speaker === "judge" || m?.speaker === "moderator");
            if (!finalVerdictMsg) return null;
            const content = finalVerdictMsg.content || "";
            let rationale = content;
            if (finalVerdictMsg.speaker === "judge") {
              const reasonMatch = content.match(/REASON:\s*([\s\S]+)/i);
              rationale = reasonMatch ? reasonMatch[1].trim() : content;
            }
            return (
              <div style={{
                marginTop: 16,
                padding: "20px 24px",
                borderRadius: "14px",
                background: theme.card,
                border: `1px solid ${theme.border}`,
                boxShadow: theme.cardShadow,
                transition: "all 0.35s",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: theme.muted, marginBottom: 8 }}>
                  ⚖️ Judge's Conclusion & Rationale
                </div>
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: theme.text,
                  whiteSpace: "pre-wrap",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                  {rationale}
                </div>
              </div>
            );
          })()
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
