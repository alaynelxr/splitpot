"use client";

interface Props {
  subtotal?: number;
  step?: number;
  onBack?: () => void;
  billName?: string | null;
  receiptDate?: string | null;
}

const fmt = (cents: number) => `S$${(cents / 100).toFixed(2)}`;

export function TopBar({ subtotal, step, onBack, billName, receiptDate }: Props) {
  const hasName = billName?.trim();
  const subtitle = hasName && receiptDate
    ? `${billName} · ${receiptDate}`
    : hasName
    ? billName!
    : receiptDate || "New Split";
  return (
    <div className="topbar">
      <div className="topbar-row">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onBack && (
            <div
              onClick={onBack}
              style={{
                fontFamily: "var(--font-pixel), 'Press Start 2P', monospace",
                fontSize: 13, color: "var(--violet)", cursor: "pointer",
                padding: "7px 10px", border: "1.5px solid var(--violet)",
                borderRadius: 6, lineHeight: 1,
                boxShadow: "0 0 8px rgba(179,123,255,0.25)",
                touchAction: "manipulation",
              }}
            >◂</div>
          )}
          <div>
            <div className="brand">▸ SPLITPOT</div>
            {step !== 1 && (
              <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 3 }}>
                {step === 2 ? "New Split · Setup" : subtitle}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {step !== undefined && step !== 1 && step !== 2 && subtotal !== undefined && (
            <div style={{
              fontFamily: "var(--font-pixel), 'Press Start 2P', monospace",
              fontSize: 14, color: "var(--mint)",
              textShadow: "0 0 8px rgba(63,255,200,0.4)",
            }}>{fmt(subtotal)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
