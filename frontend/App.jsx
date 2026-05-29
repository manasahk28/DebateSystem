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

  const nav = {
    initial:     ()     => setPage("initial"),
    home:        ()     => setPage("home"),
    startDebate: topic  => { setActiveTopic(topic); setPage("debate"); },
    history:     ()     => setPage("history"),
    transcript:  id     => { setViewDebateId(id); setPage("transcript"); },
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans, sans-serif)" }}>
      {/* ── Show initial landing page (no navbar) ── */}
      {page === "initial" && (
        <Debate2 onBegin={nav.home} />
      )}

      {/* ── Main app with navbar ── */}
      {page !== "initial" && (
        <>
          {/* ── Nav bar ── */}
          <div style={{
            borderBottom: "0.5px solid var(--color-border-tertiary)",
            padding: "0 24px",
            display: "flex", alignItems: "center", gap: 0,
            background: "var(--color-background-primary)",
          }}>
            <button onClick={nav.home} style={{
              padding: "14px 0", marginRight: 24, fontSize: 13, fontWeight: 600,
              letterSpacing: "0.06em", background: "none", border: "none",
              cursor: "pointer", color: "var(--color-text-primary)",
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
          </div>

          {/* ── Pages ── */}
          {page === "home" && (
            <HomePage onStart={nav.startDebate} />
          )}
          {page === "debate" && (
            <DebatePage
              topic={activeTopic}
              onBack={nav.home}
              onDone={() => {}}
            />
          )}
          {page === "history" && (
            <HistoryPage
              onBack={nav.home}
              onView={nav.transcript}
            />
          )}
          {page === "transcript" && (
            <TranscriptPage
              debateId={viewDebateId}
              onBack={nav.history}
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
