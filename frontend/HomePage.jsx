import { useState } from "react";

// ── inline suggestions (replace with your constants import if needed) ──────────
const SUGGESTIONS = [
  "AI will replace most human jobs within 20 years.",
  "Social media does more harm than good to society.",
  "Universal basic income should be implemented globally.",
  "Space exploration is worth the cost.",
];

// ── shared theme tokens (mirrors Debate2.jsx exactly) ─────────────────────────
function useTheme() {
  const [dark, setDark] = useState(false);

  const theme = {
    dark,
    bg:          dark ? "#0d0d1a"                          : "#ede8f5",
    card:        dark ? "#13101f"                          : "#f5f2fc",
    text:        dark ? "#e8e0f5"                          : "#1e1240",
    subtext:     dark ? "#9987cc"                          : "#5b4a8a",
    muted:       dark ? "#6b5fa0"                          : "#8b7cb5",
    accent:      dark ? "#a78bfa"                          : "#7c5cbf",
    border:      dark ? "#2a1f50"                          : "#d4c8ef",
    inputBg:     dark ? "#0d0d1a"                          : "#ffffff",
    inputBorder: dark ? "#2d2060"                          : "#c5b8e8",
    suggBg:      dark ? "#1a1330"                          : "#eee9f9",
    suggBorder:  dark ? "#2d2060"                          : "#d4c8ef",
    suggHover:   dark ? "#221848"                          : "#e4ddf5",
    btnBg:       dark ? "#7c5cbf"                          : "#9b7fd4",
    btnHover:    dark ? "#9b72d8"                          : "#8a6fc0",
    btnDisBg:    dark ? "#1e1535"                          : "#e4ddf5",
    btnDisText:  dark ? "#6b5fa0"                          : "#a896cc",
    cardShadow:  dark ? "0 8px 40px rgba(109,40,217,0.18)" : "0 8px 40px rgba(124,92,191,0.10)",
  };

  return { theme, toggleDark: () => setDark(d => !d) };
}

// ── navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ theme, toggleDark }) {
  return (
    <div
      style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        padding:        "18px 28px",
        borderBottom:   `1px solid ${theme.border}`,
        background:     theme.card,
        transition:     "background 0.35s, border-color 0.35s",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily:    "'Georgia', serif",
            fontSize:      "22px",
            fontWeight:    "700",
            color:         theme.text,
            letterSpacing: "-0.4px",
          }}
        >
          Debate2.0
        </span>
        {theme.dark && (
          <span style={{ color: "#a78bfa", fontSize: 12, marginTop: "-8px" }}>✦</span>
        )}
      </div>

      {/* Theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Sun */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          />
        </svg>

        {/* Toggle pill */}
        <div
          onClick={toggleDark}
          style={{
            width:      "46px",
            height:     "26px",
            background: theme.dark ? "#6d28d9" : "#c4b5fd",
            borderRadius: "13px",
            position:   "relative",
            cursor:     "pointer",
            transition: "background 0.3s",
          }}
        >
          <div
            style={{
              position:     "absolute",
              top:          "3px",
              left:         theme.dark ? "23px" : "3px",
              width:        "20px",
              height:       "20px",
              background:   "#fff",
              borderRadius: "50%",
              transition:   "left 0.3s",
              boxShadow:    "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        {/* Moon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────
export default function HomePage({ onStart }) {
  const { theme, toggleDark } = useTheme();
  const [topic, setTopic]     = useState("");
  const [hoveredSugg, setHoveredSugg] = useState(null);
  const [btnHovered, setBtnHovered]   = useState(false);

  const canStart = topic.trim().length > 0;

  return (
    <div
      style={{
        minHeight:  "100vh",
        background: theme.bg,
        transition: "background 0.35s",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Navbar theme={theme} toggleDark={toggleDark} />

      {/* Page body */}
      <div
        style={{
          maxWidth: "560px",
          margin:   "0 auto",
          padding:  "44px 24px 64px",
        }}
      >
        {/* Card */}
        <div
          style={{
            background:   theme.card,
            borderRadius: "20px",
            boxShadow:    theme.cardShadow,
            padding:      "36px 36px 32px",
            transition:   "background 0.35s, box-shadow 0.35s",
          }}
        >

          {/* ── Textarea ── */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                fontSize:     "12px",
                fontWeight:   "600",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color:        theme.muted,
                display:      "block",
                marginBottom: "10px",
              }}
            >
              Debate topic
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Enter a proposition to debate..."
              rows={4}
              style={{
                width:       "100%",
                boxSizing:   "border-box",
                padding:     "14px 16px",
                fontSize:    "15px",
                border:      `1px solid ${topic ? theme.accent : theme.inputBorder}`,
                borderRadius: "12px",
                resize:      "vertical",
                background:  theme.inputBg,
                color:       theme.text,
                lineHeight:  "1.7",
                outline:     "none",
                transition:  "border-color 0.2s, background 0.35s",
                fontFamily:  "system-ui, -apple-system, sans-serif",
              }}
              onFocus={e  => { e.target.style.borderColor = theme.accent; }}
              onBlur={e   => { e.target.style.borderColor = topic ? theme.accent : theme.inputBorder; }}
            />
          </div>

          {/* ── Suggestions ── */}
          <div style={{ marginBottom: "28px" }}>
            <div
              style={{
                fontSize:      "11px",
                fontWeight:    "700",
                letterSpacing: "0.08em",
                color:         theme.muted,
                marginBottom:  "10px",
                textTransform: "uppercase",
              }}
            >
              Suggestions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setTopic(s)}
                  onMouseEnter={() => setHoveredSugg(i)}
                  onMouseLeave={() => setHoveredSugg(null)}
                  style={{
                    textAlign:    "left",
                    padding:      "11px 14px",
                    fontSize:     "14px",
                    border:       `1px solid ${hoveredSugg === i ? theme.accent : theme.suggBorder}`,
                    borderRadius: "10px",
                    background:   hoveredSugg === i ? theme.suggHover : theme.suggBg,
                    color:        hoveredSugg === i ? theme.accent : theme.text,
                    cursor:       "pointer",
                    transition:   "all 0.15s",
                    lineHeight:   "1.5",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        "12px",
              margin:     "0 0 24px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: theme.border }} />
            <span style={{ color: theme.accent, fontSize: "14px" }}>✦</span>
            <div style={{ flex: 1, height: "1px", background: theme.border }} />
          </div>

          {/* ── Start button ── */}
          <button
            onClick={() => canStart && onStart && onStart(topic.trim())}
            disabled={!canStart}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width:        "100%",
              padding:      "14px",
              fontSize:     "15px",
              fontWeight:   "600",
              background:   canStart
                              ? (btnHovered ? theme.btnHover : theme.btnBg)
                              : theme.btnDisBg,
              color:        canStart ? "#fff" : theme.btnDisText,
              border:       "none",
              borderRadius: "12px",
              cursor:       canStart ? "pointer" : "default",
              transition:   "background 0.2s, transform 0.15s",
              transform:    canStart && btnHovered ? "translateY(-1px)" : "translateY(0)",
              boxShadow:    canStart
                              ? (theme.dark
                                  ? "0 0 24px rgba(124,92,191,0.4)"
                                  : "0 4px 16px rgba(124,92,191,0.3)")
                              : "none",
              letterSpacing: "0.01em",
            }}
          >
            Start debate →
          </button>
        </div>
      </div>
    </div>
  );
}
