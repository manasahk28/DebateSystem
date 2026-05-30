import { useState } from "react";
import Debate2 from "./Debate2";
import HomePage from "./HomePage";
import DebatePage from "./DebatePage";
import HistoryPage from "./HistoryPage";
import TranscriptPage from "./TranscriptPage";

const getOrCreateUserId = () => {
  let id = localStorage.getItem("debate_user_id");
  if (!id) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = "user_" + Math.random().toString(36).substring(2, 15);
    }
    localStorage.setItem("debate_user_id", id);
  }
  return id;
};

const userId = getOrCreateUserId();

export default function App() {
  const [page, setPage] = useState("initial"); // initial | home | debate | history | transcript
  const [activeTopic, setActiveTopic] = useState("");
  const [viewDebateId, setViewDebateId] = useState(null);
  const [dark, setDark] = useState(false);

  const theme = {
    dark,
    bg: dark ? "#0d0d1a" : "#ede8f5",
    card: dark ? "#13101f" : "#f5f2fc",
    text: dark ? "#e8e0f5" : "#1e1240",
    subtext: dark ? "#9987cc" : "#5b4a8a",
    muted: dark ? "#6b5fa0" : "#8b7cb5",
    accent: dark ? "#a78bfa" : "#7c5cbf",
    border: dark ? "#2a1f50" : "#d4c8ef",
    rowBg: dark ? "#13101f" : "#ffffff",
    rowHover: dark ? "#1a1330" : "#f0ebfc",
    rowBorder: dark ? "#2d2060" : "#ddd6f5",
    btnBg: dark ? "#1e1535" : "#eee9f9",
    btnText: dark ? "#a78bfa" : "#7c5cbf",
    btnBorder: dark ? "#2d2060" : "#c4b5fd",
    btnHover: dark ? "#9b72d8" : "#8a6fc0",
    btnDisBg: dark ? "#1e1535" : "#e4ddf5",
    btnDisText: dark ? "#6b5fa0" : "#a896cc",
    inputBg: dark ? "#0d0d1a" : "#ffffff",
    inputBorder: dark ? "#2d2060" : "#c5b8e8",
    suggBg: dark ? "#1a1330" : "#eee9f9",
    suggBorder: dark ? "#2d2060" : "#d4c8ef",
    suggHover: dark ? "#221848" : "#e4ddf5",
    proBg: dark ? "rgba(52,211,153,0.08)" : "rgba(52,211,153,0.10)",
    proBorder: dark ? "rgba(52,211,153,0.25)" : "rgba(16,185,129,0.30)",
    proText: dark ? "#34d399" : "#059669",
    conBg: dark ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.10)",
    conBorder: dark ? "rgba(248,113,113,0.25)" : "rgba(239,68,68,0.30)",
    conText: dark ? "#f87171" : "#dc2626",
    factBg: dark ? "rgba(167,139,250,0.08)" : "rgba(124,92,191,0.07)",
    factBorder: dark ? "rgba(167,139,250,0.25)" : "rgba(124,92,191,0.20)",
    factText: dark ? "#a78bfa" : "#7c5cbf",
    judgeBg: dark ? "rgba(251,191,36,0.08)" : "rgba(251,191,36,0.10)",
    judgeBorder: dark ? "rgba(251,191,36,0.25)" : "rgba(217,119,6,0.25)",
    judgeText: dark ? "#fbbf24" : "#d97706",
    danger: dark ? "#f87171" : "#dc2626",
    dangerBg: dark ? "rgba(248,113,113,0.08)" : "rgba(254,226,226,1)",
    dangerBorder: dark ? "rgba(248,113,113,0.25)" : "rgba(220,38,38,0.30)",
    success: dark ? "#34d399" : "#059669",
    statBg: dark ? "#1a1330" : "#eee9f9",
    cardShadow: dark ? "0 8px 40px rgba(109,40,217,0.18)" : "0 8px 40px rgba(124,92,191,0.10)",
  };

  const toggleDark = () => setDark((prev) => !prev);

  const nav = {
    initial: () => setPage("initial"),
    home: () => setPage("home"),
    startDebate: topic => { setActiveTopic(topic); setPage("debate"); },
    history: () => setPage("history"),
    transcript: id => { setViewDebateId(id); setPage("transcript"); },
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
            <button onClick={nav.initial} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "14px 0", marginRight: 24,
              background: "none", border: "none",
              cursor: "pointer", color: theme.text,
              fontFamily: "'Georgia', serif",
              fontSize: "26px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}>
              <span>Debate2.0</span>
              {dark && (
                <span style={{ color: "#a78bfa", fontSize: "13px", marginTop: "-10px" }}>
                  ✦
                </span>
              )}
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
              <div
                onClick={() => setDark(!dark)}
                style={{
                  width: "46px",
                  height: "26px",
                  background: dark ? "#6d28d9" : "#c4b5fd",
                  borderRadius: "13px",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
              >
                {/* Sun Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted, position: "absolute", left: "4px", top: "4px" }}><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /></svg>
                {/* Toggle Circle */}
                <div
                  style={{
                    position: "absolute",
                    top: "3px",
                    left: dark ? "23px" : "3px",
                    width: "20px",
                    height: "20px",
                    background: "#fff",
                    borderRadius: "50%",
                    transition: "left 0.3s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }}
                />
                {/* Moon Icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted, position: "absolute", right: "4px", top: "4px" }}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
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
              onDone={() => { }}
              theme={theme}
              userId={userId}
            />
          )}
          {page === "history" && (
            <HistoryPage
              onBack={nav.home}
              onView={nav.transcript}
              theme={theme}
              userId={userId}
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
