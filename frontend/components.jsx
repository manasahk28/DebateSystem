import { SPEAKER_COLOR, STAGE_LABELS, WINNER_COLOR } from "./constants";

// ── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ speaker }) {
  const c = SPEAKER_COLOR[speaker] || SPEAKER_COLOR.moderator;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      padding: "2px 8px", borderRadius: 4,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontFamily: "var(--font-mono, monospace)",
    }}>
      {c.label}
    </span>
  );
}

// ── ValidatedPill ─────────────────────────────────────────────────────────────

export function ValidatedPill({ validated }) {
  if (validated === undefined || validated === null) return null;
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4,
      background: validated ? "#eaf3de" : "#fcebeb",
      color: validated ? "#27500a" : "#791f1f",
      border: `1px solid ${validated ? "#639922" : "#a32d2d"}`,
    }}>
      {validated ? "✓ fact-checked" : "✗ failed fact-check"}
    </span>
  );
}

// ── TurnCard ──────────────────────────────────────────────────────────────────

export function TurnCard({ msg, index, isNew }) {
  const c = SPEAKER_COLOR[msg.speaker] || SPEAKER_COLOR.moderator;
  return (
    <div style={{
      display: "flex", gap: 14, padding: "16px 0",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      opacity: isNew ? 0 : 1,
      animation: isNew ? "fadeSlide 0.35s ease forwards" : "none",
      animationDelay: `${index * 0.03}s`,
    }}>
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: c.bg, border: `1.5px solid ${c.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: c.text,
          fontFamily: "var(--font-mono, monospace)",
        }}>
          {c.label.slice(0, 1)}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <Badge speaker={msg.speaker} />
          {msg.stage && (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {STAGE_LABELS[msg.stage] || msg.stage}
            </span>
          )}
          {msg.round_number && (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              · Round {msg.round_number}
            </span>
          )}
          <ValidatedPill validated={msg.validated} />
        </div>
        <p style={{
          margin: 0, fontSize: 14, lineHeight: 1.7,
          color: "var(--color-text-primary)", whiteSpace: "pre-wrap",
        }}>
          {msg.content}
        </p>
      </div>
    </div>
  );
}

// ── WinnerBanner ──────────────────────────────────────────────────────────────

export function WinnerBanner({ winner, disqualified }) {
  const c = WINNER_COLOR[winner] || WINNER_COLOR.draw;
  const label = winner === "pro" ? "PRO wins" : winner === "con" ? "CON wins" : "Draw";
  return (
    <div style={{
      margin: "24px 0 0", padding: "20px 24px",
      background: c.bg, border: `2px solid ${c.accent}`,
      borderRadius: 12, display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        fontSize: 32, width: 52, height: 52, borderRadius: "50%",
        background: c.accent + "22",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {winner === "draw" ? "⚖" : "🏆"}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: c.text, marginBottom: 2 }}>
          DEBATE CONCLUDED
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: c.text }}>{label}</div>
        {disqualified && (
          <div style={{ fontSize: 12, color: c.text, marginTop: 2, opacity: 0.8 }}>
            {disqualified.toUpperCase()} disqualified on fact-check violations
          </div>
        )}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

export function StatCard({ label, value }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: 8, padding: "12px 16px", flex: 1,
    }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500 }}>{value ?? "—"}</div>
    </div>
  );
}

// ── RoundPill ─────────────────────────────────────────────────────────────────

export function RoundPill({ num, active }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: active ? "var(--color-background-info)" : "var(--color-background-secondary)",
      border: `1px solid ${active ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 500,
      color: active ? "var(--color-text-info)" : "var(--color-text-secondary)",
    }}>
      {num}
    </div>
  );
}
