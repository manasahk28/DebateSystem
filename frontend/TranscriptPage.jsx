import { useState, useEffect } from "react";
import { API } from "./constants";
import { TurnCard } from "./components";

export default function TranscriptPage({ debateId, onBack, theme }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/debate/${debateId}/transcript`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debateId]);

  if (loading) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px", color: "var(--color-text-secondary)", fontSize: 13 }}>
      Loading…
    </div>
  );

  if (!data) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px", color: "var(--color-text-danger)", fontSize: 13 }}>
      Transcript not found.
    </div>
  );

  const sortedMessages = [...(data?.messages || [])].sort(
    (a, b) => (a.turn_number || 0) - (b.turn_number || 0)
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          padding: "4px 8px", fontSize: 12,
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 6, background: "transparent",
          color: "var(--color-text-secondary)", cursor: "pointer",
        }}>
          ← back
        </button>
        <div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 2 }}>
            TRANSCRIPT
          </div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{data.topic}</div>
        </div>

        {/* CSV export link */}
        <a
          href={`${API}/debate/${debateId}/export`}
          target="_blank"
          rel="noreferrer"
          style={{
            marginLeft: "auto", fontSize: 12, padding: "6px 12px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 6, textDecoration: "none",
            color: "var(--color-text-primary)",
            background: "var(--color-background-secondary)",
          }}
        >
          Export CSV
        </a>
      </div>

      {/* Full turn-by-turn replay */}
      <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
        {sortedMessages.map((msg, i) => (
          <TurnCard key={`${msg?.speaker || "unknown"}-${msg?.turn_number || i}`} msg={msg} index={i} isNew={false} />
        ))}
      </div>
    </div>
  );
}
