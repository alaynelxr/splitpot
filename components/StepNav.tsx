"use client";

interface Props { step: number; total?: number; }

export function StepNav({ step, total = 6 }: Props) {
  return (
    <div className="step-nav">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          style={{
            width: n === step ? 22 : 8, height: 4, borderRadius: 2,
            background: n === step ? "var(--pink)" : n < step ? "var(--violet-dim)" : "var(--surface-2)",
            transition: "all 0.2s",
            boxShadow: n === step ? "0 0 8px rgba(255,58,163,0.6)" : "none",
          }}
        />
      ))}
    </div>
  );
}
