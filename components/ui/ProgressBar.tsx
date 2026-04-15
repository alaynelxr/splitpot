"use client";

interface ProgressBarProps {
  progress: number; // 0–1
  label?: string;
  className?: string;
}

export function ProgressBar({ progress, label, className = "" }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <div className={["w-full", className].join(" ")}>
      {label && (
        <p className="font-heading text-xs text-muted mb-2 tracking-wider">{label}</p>
      )}
      {/* Track */}
      <div className="relative h-4 w-full bg-surface border border-dashed border-border overflow-hidden">
        {/* Tick marks */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-dashed border-border/40 last:border-r-0"
            />
          ))}
        </div>
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Numeric */}
      <p className="font-heading text-xs text-muted mt-1 text-right">{pct}%</p>
    </div>
  );
}
