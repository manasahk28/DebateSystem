import { SPEAKER_COLOR, STAGE_LABELS, WINNER_COLOR } from "./constants";

// ── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ speaker }) {
  const c = SPEAKER_COLOR[speaker] || SPEAKER_COLOR.default;
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

    const winnerStyle = winner === "PRO" ? SPEAKER_COLOR.pro : winner === "CON" ? SPEAKER_COLOR.con : SPEAKER_COLOR.judge;
    const j = SPEAKER_COLOR.judge;

    return (
      <div style={{
        padding: "24px 28px",
        margin: "12px 0 24px",
        background: `linear-gradient(135deg, ${j.bg} 0%, var(--color-background-secondary, #fafafa) 100%)`,
        borderLeft: `5px solid ${j.border}`,
        borderRadius: "0 12px 12px 0",
        borderTop: "0.5px solid var(--color-border-tertiary)",
        borderRight: "0.5px solid var(--color-border-tertiary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        opacity: isNew ? 0 : 1,
        animation: isNew ? "fadeSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
        animationDelay: `${index * 0.03}s`,
        transition: "all 0.35s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
            padding: "4px 10px", borderRadius: 6,
            background: j.border, color: "#fff",
            fontFamily: "monospace",
          }}>
            {title}
          </span>
          {msg.round_number && (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>Concluded in Round {msg.round_number}</span>
          )}
        </div>
        
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20,
          background: winnerStyle.bg, padding: "16px 20px", borderRadius: "12px",
          border: `1.5px solid ${winnerStyle.border}`,
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 4 }}>
              Decision Result
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: winnerStyle.text, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🏆</span> {winner} WINS
            </div>
          </div>
          {isDisqualified && disqualified && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-danger, #791f1f)", marginBottom: 4 }}>
                Infraction Details
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-danger, #791f1f)" }}>
                ⚠️ {disqualified} Disqualified
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 6 }}>
            Judicial Rationale & Analysis
          </div>
          <div style={{
            fontSize: 14, lineHeight: 1.75, color: "var(--color-text-primary)",
            background: "var(--color-background-primary, #fff)", padding: "14px 18px", borderRadius: "10px",
            border: "0.5px solid var(--color-border-tertiary)",
            whiteSpace: "pre-wrap",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
          }}>
            {reason}
          </div>
        </div>
      </div>
    );
  }

  const c = SPEAKER_COLOR[speaker] || SPEAKER_COLOR.default;
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
          <Badge speaker={speaker} />
          {stage && (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {STAGE_LABELS[stage] || stage}
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
          {content}
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
