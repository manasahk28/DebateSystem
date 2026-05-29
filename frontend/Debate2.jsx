import { useState } from "react";

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor"/>
    <path d="M19 16L19.75 18.25L22 19L19.75 19.75L19 22L18.25 19.75L16 19L18.25 18.25L19 16Z" fill="currentColor" opacity="0.6"/>
    <path d="M5 4L5.5 5.5L7 6L5.5 6.5L5 8L4.5 6.5L3 6L4.5 5.5L5 4Z" fill="currentColor" opacity="0.4"/>
  </svg>
);

const QuestionBubble = ({ dark }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={dark ? "#a78bfa" : "#7c3aed"} strokeWidth="1.5"/>
    <path d="M9.5 9C9.5 7.619 10.619 6.5 12 6.5C13.381 6.5 14.5 7.619 14.5 9C14.5 10.381 13.381 11.5 12 11.5V13" stroke={dark ? "#a78bfa" : "#7c3aed"} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="15.5" r="0.75" fill={dark ? "#a78bfa" : "#7c3aed"}/>
  </svg>
);

export default function Debate2({ onBegin }) {
  const [dark, setDark] = useState(false);

  const theme = {
    bg: dark ? "#0d0d1a" : "#ede8f5",
    card: dark ? "#13101f" : "#f5f2fc",
    text: dark ? "#e8e0f5" : "#1e1240",
    subtext: dark ? "#9987cc" : "#5b4a8a",
    muted: dark ? "#6b5fa0" : "#8b7cb5",
    accent: dark ? "#a78bfa" : "#7c5cbf",
    accentGlow: dark ? "#7c3aed" : "#9b72d8",
    tldrBg: dark ? "#1e1535" : "#ede8f5",
    tldrBorder: dark ? "#2d2060" : "#d4c8ef",
    btnBg: dark ? "#7c5cbf" : "#9b7fd4",
    btnHover: dark ? "#9b72d8" : "#8a6fc0",
    btnText: "#ffffff",
    divider: dark ? "#2a1f50" : "#c5b8e8",
    toggleTrack: dark ? "#6d28d9" : "#c4b5fd",
    cardShadow: dark
      ? "0 8px 40px rgba(109,40,217,0.18)"
      : "0 8px 40px rgba(124,92,191,0.10)",
    name: dark ? "#a78bfa" : "#1e1240",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        transition: "background 0.35s",
      }}
    >
      <div
        style={{
          background: theme.card,
          borderRadius: "20px",
          boxShadow: theme.cardShadow,
          padding: "40px 44px 36px",
          maxWidth: "560px",
          width: "100%",
          position: "relative",
          transition: "background 0.35s, box-shadow 0.35s",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "26px",
                fontWeight: "700",
                color: theme.text,
                letterSpacing: "-0.5px",
              }}
            >
              Debate2.0
            </span>
            {dark && (
              <span style={{ color: "#a78bfa", fontSize: "13px", marginTop: "-10px" }}>
                ✦
              </span>
            )}
          </div>

          {/* Dark/Light Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Sun */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {/* Toggle */}
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
            </div>
            {/* Moon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: theme.muted }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: theme.text,
              lineHeight: "1.55",
              marginBottom: "14px",
              margin: "0 0 14px",
            }}
          >
            Hey! Meet your AI debate bestie,{" "}
            <span style={{ color: theme.accent }}>Deb8flow</span>
            {" "}—{" "}
            <br />
            where we let the bots battle it out for the truth.{" "}
            <span style={{ fontSize: "18px" }}>🎤🔥</span>
          </p>

          <p
            style={{
              fontSize: "14px",
              color: theme.subtext,
              lineHeight: "1.7",
              margin: "0 0 20px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            We put two AI agents head-to-head in a full-on logic showdown.
            <br />
            No rambling, no fluff — a fact-checker keeps things accurate,
            <br />
            and a judge decides the winner. It's basically a big LangGraph flex,
            <br />
            showing off what advanced multi-agent workflows are truly capable of.
          </p>

          {/* TL;DR box */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              background: theme.tldrBg,
              border: `1px solid ${theme.tldrBorder}`,
              borderRadius: "12px",
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                background: dark ? "#2d1f5e" : "#ddd6fe",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: theme.accent,
              }}
            >
              <SparkleIcon />
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "14px",
                  color: theme.text,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                <span style={{ color: theme.accent, fontWeight: "700" }}>TL;DR:</span>{" "}
                Pure facts, sharp reasoning, and zero hallucinations.{" "}
                <span>🚀</span>
              </p>
              <span style={{ color: theme.accent, fontSize: "14px" }}>✦</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: theme.divider }} />
          <span style={{ color: theme.accent, fontSize: "16px" }}>✦</span>
          <div style={{ flex: 1, height: "1px", background: theme.divider }} />
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            <QuestionBubble dark={dark} />
            <span
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: theme.text,
              }}
            >
              Got a question in mind?
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: theme.muted,
              margin: "0 0 20px",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Cool — let's get the answer from our agents...
          </p>

          <button
            onClick={onBegin}
            style={{
              background: theme.btnBg,
              color: theme.btnText,
              border: "none",
              borderRadius: "12px",
              padding: "14px 40px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              letterSpacing: "0.2px",
              transition: "background 0.2s, transform 0.15s",
              boxShadow: dark
                ? "0 0 24px rgba(124,92,191,0.4)"
                : "0 4px 16px rgba(124,92,191,0.3)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = theme.btnHover;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = theme.btnBg;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Let's begin
            <span style={{ fontSize: "18px" }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
