export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const STAGE_LABELS = {
  opening: "Opening",
  rebuttal: "Rebuttal",
  counter: "Counter",
  final_argument: "Final Argument",
  end: "Verdict",
};

export const SPEAKER_COLOR = {
  pro:          { bg: "#e6f1fb", border: "#378add", text: "#0c447c", label: "PRO" },
  con:          { bg: "#fbeaf0", border: "#d4537e", text: "#72243e", label: "CON" },
  judge:        { bg: "#faeeda", border: "#ba7517", text: "#633806", label: "JUDGE" },
  moderator:    { bg: "#f1efe8", border: "#888780", text: "#444441", label: "MOD" },
  fact_checker: { bg: "#fef9c3", border: "#ca8a04", text: "#854d0e", label: "FACT CHECK" },
  fact_check:   { bg: "#fef9c3", border: "#ca8a04", text: "#854d0e", label: "FACT CHECK" },
  default:      { bg: "#f1efe8", border: "#888780", text: "#444441", label: "DEBATE" },
};

export const WINNER_COLOR = {
  pro:  { bg: "#e6f1fb", accent: "#378add", text: "#0c447c" },
  con:  { bg: "#fbeaf0", accent: "#d4537e", text: "#72243e" },
  draw: { bg: "#eaf3de", accent: "#639922", text: "#27500a" },
};

export const SUGGESTIONS = [
  "AI will replace most human jobs within 20 years",
  "Social media does more harm than good to society",
  "Universal basic income should be implemented globally",
  "Nuclear energy is essential for a sustainable future",
];
