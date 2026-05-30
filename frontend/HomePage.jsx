import { useState } from "react";

// ── inline suggestions (replace with your constants import if needed) ──────────
const SUGGESTIONS = [
  "AI will replace most human jobs within 20 years.",
  "Social media does more harm than good to society.",
  "Universal basic income should be implemented globally.",
  "Space exploration is worth the cost.",
];

// ── main page ──────────────────────────────────────────────────────────────────
export default function HomePage({ onStart, theme }) {
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
