import { useState } from "react";
import Debate2        from "./Debate2";
import HomePage       from "./HomePage";
import DebatePage     from "./DebatePage";
import HistoryPage    from "./HistoryPage";
import TranscriptPage from "./TranscriptPage";

export default function App() {
  const [page,         setPage]         = useState("initial"); // initial | home | debate | history | transcript
  const [activeTopic,  setActiveTopic]  = useState("");
  const [viewDebateId, setViewDebateId] = useState(null);
  const [dark,         setDark]         = useState(false);

  const theme = {
    dark,
    bg:          dark ? "#0d0d1a" : "#ede8f5",
    card:        dark ? "#13101f" : "#f5f2fc",
    text:        dark ? "#e8e0f5" : "#1e1240",
    subtext:     dark ? "#9987cc" : "#5b4a8a",
    muted:       dark ? "#6b5fa0" : "#8b7cb5",
    accent:      dark ? "#a78bfa" : "#7c5cbf",
    border:      dark ? "#2a1f50" : "#d4c8ef",
    rowBg:       dark ? "#13101f" : "#ffffff",
    rowHover:    dark ? "#1a1330" : "#f0ebfc",
    rowBorder:   dark ? "#2d2060" : "#ddd6f5",
    btnBg:       dark ? "#1e1535" : "#eee9f9",
    btnText:     dark ? "#a78bfa" : "#7c5cbf",
    btnBorder:   dark ? "#2d2060" : "#c4b5fd",
    btnHover:    dark ? "#9b72d8" : "#8a6fc0",
    btnDisBg:    dark ? "#1e1535" : "#e4ddf5",
    btnDisText:  dark ? "#6b5fa0" : "#a896cc",
    inputBg:     dark ? "#0d0d1a" : "#ffffff",
    inputBorder: dark ? "#2d2060" : "#c5b8e8",
    suggBg:      dark ? "#1a1330" : "#eee9f9",
    suggBorder:  dark ? "#2d2060" : "#d4c8ef",
    suggHover:   dark ? "#221848" : "#e4ddf5",
    proBg:       dark ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.10)",
    proBorder:   dark ? "rgba(52,211,153,0.25)" : "rgba(16,185,129,0.30)",
    proText:     dark ? "#34d399" : "#059669",
    conBg:       dark ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.10)",
    conBorder:   dark ? "rgba(248,113,113,0.25)" : "rgba(239,68,68,0.30)",
    conText:     dark ? "#f87171" : "#dc2626",
    factBg:      dark ? "rgba(167,139,250,0.08)" : "rgba(124,92,191,0.07)",
    factBorder:  dark ? "rgba(167,139,250,0.25)" : "rgba(124,92,191,0.20)",
    factText:    dark ? "#a78bfa" : "#7c5cbf",
    judgeBg:     dark ? "rgba(251,191,36,0.08)" : "rgba(251,191,36,0.10)",
    judgeBorder: dark ? "rgba(251,191,36,0.25)" : "rgba(217,119,6,0.25)",
    judgeText:   dark ? "#fbbf24" : "#d97706",
    danger:      dark ? "#f87171" : "#dc2626",
    dangerBg:    dark ? "rgba(248,113,113,0.08)" : "rgba(254,226,226,1)",
    dangerBorder: dark ? "rgba(248,113,113,0.25)" : "rgba(220,38,38,0.30)",
    success:     dark ? "#34d399" : "#059669",
    statBg:      dark ? "#1a1330" : "#eee9f9",
    cardShadow:  dark ? "0 8px 40px rgba(109,40,217,0.18)" : "0 8px 40px rgba(124,92,191,0.10)",
  };

  const toggleDark = () => setDark((prev) => !prev);

  const nav = {
    initial:     ()     => setPage("initial"),
    home:        ()     => setPage("home"),
    startDebate: topic  => { setActiveTopic(topic); setPage("debate"); },
    history:     ()     => setPage("history"),
    transcript:  id     => { setViewDebateId(id); setPage("transcript"); },
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans, sans-serif)", background: theme.bg, color: theme.text }}>
      {/* ── Show initial landing page (no navbar) ── */}
      {page === "initial" && (
        <Debate2 onBegin={nav.home} />
      )}

      {/* ── Main app with navbar ── */}
      {page !== "initial" && (
        <>
          {/* ── Nav bar ── */}
          <div style={{
            borderBottom: `0.5px solid ${theme.border}`,
            padding: "0 24px",
            display: "flex", alignItems: "center", gap: 0,
            background: theme.card,
            color: theme.text,
          }}>
            <button onClick={nav.home} style={{
              padding: "14px 0", marginRight: 24, fontSize: 13, fontWeight: 600,
              letterSpacing: "0.06em", background: "none", border: "none",
              cursor: "pointer", color: theme.text,
            }}>
              DEBATEFLOW
            </button>

            <NavTab
              label="New debate"
              active={page === "home" || page === "debate"}
              onClick={nav.home}
            />
            <NavTab
              label="History"
              active={page === "history" || page === "transcript"}
              onClick={nav.history}
            />

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={toggleDark}
                style={{
                  padding: "10px 14px", fontSize: 13, borderRadius: 10,
                  border: `1px solid ${theme.btnBorder}`,
                  background: theme.btnBg,
                  color: theme.btnText,
                  cursor: "pointer",
                }}
              >
                {dark ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </div>

          {/* ── Pages ── */}
          {page === "home" && (
            <HomePage onStart={nav.startDebate} theme={theme} />
          )}
          {page === "debate" && (
            <DebatePage
              topic={activeTopic}
              onBack={nav.home}
              onDone={() => {}}
              theme={theme}
            />
          )}
          {page === "history" && (
            <HistoryPage
              onBack={nav.home}
              onView={nav.transcript}
              theme={theme}
            />
          )}
          {page === "transcript" && (
            <TranscriptPage
              debateId={viewDebateId}
              onBack={nav.history}
              theme={theme}
            />
          )}
        </>
      )}
    </div>
  );
}


// ── NavTab helper ─────────────────────────────────────────────────────────────

function NavTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "14px 0", marginRight: 20, fontSize: 13,
      background: "none", border: "none", cursor: "pointer",
      color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
      borderBottom: active ? "2px solid var(--color-text-primary)" : "2px solid transparent",
    }}>
      {label}
    </button>
  );
}
