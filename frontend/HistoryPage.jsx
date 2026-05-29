import { useState, useEffect } from "react";

// ── replace with your actual constants if integrating ─────────────────────────
const API = "http://localhost:8000";
const WINNER_COLOR = {
  pro:  { bg: "rgba(52,211,153,0.15)", text: "#10b981", accent: "#34d399" },
  con:  { bg: "rgba(248,113,113,0.15)", text: "#ef4444", accent: "#f87171" },
  draw: { bg: "rgba(167,139,250,0.15)", text: "#a78bfa", accent: "#a78bfa" },
};

// ── shared theme (mirrors Debate2.jsx + HomePage.jsx exactly) ─────────────────
function useTheme() {
  const [dark, setDark] = useState(false);
  const theme = {
    dark,
    bg:          dark ? "#0d0d1a"                           : "#ede8f5",
    card:        dark ? "#13101f"                           : "#f5f2fc",
    text:        dark ? "#e8e0f5"                           : "#1e1240",
    subtext:     dark ? "#9987cc"                           : "#5b4a8a",
    muted:       dark ? "#6b5fa0"                           : "#8b7cb5",
    accent:      dark ? "#a78bfa"                           : "#7c5cbf",
    border:      dark ? "#2a1f50"                           : "#d4c8ef",
    rowBg:       dark ? "#13101f"                           : "#ffffff",
    rowHover:    dark ? "#1a1330"                           : "#f0ebfc",
    rowBorder:   dark ? "#2d2060"                           : "#ddd6f5",
    btnBg:       dark ? "#1e1535"                           : "#eee9f9",
    btnText:     dark ? "#a78bfa"                           : "#7c5cbf",
    btnBorder:   dark ? "#2d2060"                           : "#d4c8ef",
    danger:      dark ? "#f87171"                           : "#dc2626",
    cardShadow:  dark ? "0 8px 40px rgba(109,40,217,0.18)" : "0 8px 40px rgba(124,92,191,0.10)",
  };
  return { theme, toggleDark: () => setDark(d => !d) };
}

// ── navbar (identical to Debate2 / HomePage) ──────────────────────────────────
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
        {/* Sun */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {/* Toggle pill */}
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
        {/* Moon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── skeleton loader row ───────────────────────────────────────────────────────
function SkeletonRow({ theme }) {
  return (
    <div style={{
      padding: "16px 18px",
      background: theme.rowBg,
      border: `1px solid ${theme.rowBorder}`,
      borderRadius: "12px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 14, width: "60%", borderRadius: 6, background: theme.border, opacity: 0.6 }} />
        <div style={{ height: 11, width: "35%", borderRadius: 6, background: theme.border, opacity: 0.4 }} />
      </div>
      <div style={{ height: 24, width: 72, borderRadius: 6, background: theme.border, opacity: 0.4 }} />
      <div style={{ height: 30, width: 54, borderRadius: 8, background: theme.border, opacity: 0.4 }} />
    </div>
  );
}

function formatIST(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return timestamp;
  }
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function HistoryPage({ onBack, onView }) {
  const { theme, toggleDark } = useTheme();
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [hovered, setHovered] = useState(null);
  const [backHovered, setBackHovered] = useState(false);

  useEffect(() => {
    fetch(`${API}/debates`)
      .then(r => r.json())
      .then(d => { setDebates(d.debates || []); setLoading(false); })
      .catch(() => { setError("Could not load debates. Is the API running?"); setLoading(false); });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      transition: "background 0.35s",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <Navbar theme={theme} toggleDark={toggleDark} />

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 24px 64px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            onClick={onBack}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              padding: "6px 12px", fontSize: 13,
              border: `1px solid ${backHovered ? theme.accent : theme.btnBorder}`,
              borderRadius: 8, background: "transparent",
              color: backHovered ? theme.accent : theme.muted,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            ← back
          </button>
          <h2 style={{
            margin: 0, fontSize: 20, fontWeight: 600,
            color: theme.text,
            fontFamily: "'Georgia', serif",
          }}>
            Past debates
          </h2>
          {!loading && !error && debates.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px",
              borderRadius: 20, background: theme.btnBg,
              color: theme.btnText, letterSpacing: "0.05em",
            }}>
              {debates.length}
            </span>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: "1px", background: theme.border }} />
          <span style={{ color: theme.accent, fontSize: 14 }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: theme.border }} />
        </div>

        {/* ── Loading skeletons ── */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => <SkeletonRow key={i} theme={theme} />)}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: "16px 18px",
            background: theme.rowBg,
            border: `1px solid ${theme.rowBorder}`,
            borderRadius: "12px",
            color: theme.danger, fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && debates.length === 0 && (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            color: theme.muted, fontSize: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            No debates yet. Start your first one!
          </div>
        )}

        {/* ── Debate list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {debates.map((d, i) => {
            const wc = d.winner ? WINNER_COLOR[d.winner] : null;
            const isHovered = hovered === i;
            return (
              <div
                key={d.debate_id}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: "16px 18px",
                  background: isHovered ? theme.rowHover : theme.rowBg,
                  border: `1px solid ${isHovered ? theme.accent : theme.rowBorder}`,
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.18s",
                  boxShadow: isHovered ? theme.cardShadow : "none",
                }}
              >
                {/* Topic + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, marginBottom: 5,
                    color: theme.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {d.topic}
                  </div>
                  <div style={{
                    fontSize: 12, color: theme.subtext,
                    display: "flex", gap: 14,
                  }}>
                    <span>{d.total_messages} messages</span>
                    <span>{d.total_rounds} rounds</span>
                    <span>{formatIST(d.started_at)} IST</span>
                  </div>
                </div>

                {/* Winner pill */}
                {d.winner && wc && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 6, background: wc.bg, color: wc.text,
                    border: `1px solid ${wc.accent}`, whiteSpace: "nowrap",
                    letterSpacing: "0.05em",
                  }}>
                    {d.winner === "draw" ? "DRAW" : `${d.winner.toUpperCase()} WINS`}
                  </span>
                )}

                {/* View button */}
                <button
                  onClick={() => onView && onView(d.debate_id)}
                  style={{
                    flexShrink: 0, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${isHovered ? theme.accent : theme.btnBorder}`,
                    borderRadius: 8, background: isHovered ? theme.accent : "transparent",
                    color: isHovered ? "#fff" : theme.btnText,
                    cursor: "pointer", transition: "all 0.18s",
                  }}
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
