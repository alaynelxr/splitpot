"use client";

import { useRef, useEffect, useState } from "react";
import type { LineItem } from "@/types";

interface Props {
  item: LineItem;
  onClose: () => void;
  onApply: (patch: { name: string; priceCents: number; unclear: false }) => void;
  onDelete: () => void;
}

export function FixSheet({ item, onClose, onApply, onDelete }: Props) {
  const [name, setName] = useState(item.unclear ? "" : item.name);
  const [priceStr, setPriceStr] = useState(
    item.priceCents > 0 ? (item.priceCents / 100).toFixed(2) : ""
  );
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const price = parseFloat(priceStr);
  const canApply = name.trim().length > 0 && !Number.isNaN(price) && price > 0;

  const apply = () => {
    if (!canApply) return;
    onApply({ name: name.trim(), priceCents: Math.round(price * 100), unclear: false });
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="sheet-title" style={{ color: "var(--gold)" }}>Fix This Line</div>
            <div className="sheet-sub">OCR couldn&apos;t read this one · fill it in</div>
          </div>
          <div style={{
            fontFamily: "var(--font-pixel), 'Press Start 2P', monospace", fontSize: 8,
            color: "var(--gold)", padding: "4px 7px 3px",
            background: "rgba(255,212,71,0.12)", border: "1px solid var(--gold-dim)",
            borderRadius: 3, letterSpacing: "0.1em",
          }}>⚠ UNCLEAR</div>
        </div>

        <div className="fix-fields">
          <label className="fix-field">
            <div className="fix-label">ITEM NAME</div>
            <input
              ref={nameRef}
              className="fix-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Rice"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="fix-field">
            <div className="fix-label">PRICE · SGD</div>
            <div className="fix-price-wrap">
              <span className="fix-prefix">S$</span>
              <input
                className="fix-input price"
                type="text"
                inputMode="decimal"
                value={priceStr}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = v.split(".");
                  setPriceStr(parts.length > 1 ? parts[0] + "." + parts[1].slice(0, 2) : v);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
                placeholder="0.00"
              />
            </div>
          </label>
        </div>

        <div className="fix-delete" onClick={() => { onDelete(); onClose(); }}>
          ✕ Not a real item · remove
        </div>

        <button className="sheet-cta" onClick={apply} disabled={!canApply}>
          ▸ SAVE LINE
        </button>
      </div>
    </>
  );
}
