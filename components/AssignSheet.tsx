"use client";

import { useState } from "react";
import type { LineItem, Participant } from "@/types";
import { AvatarDot } from "./AvatarDot";

const fmt = (cents: number) => `S$${(cents / 100).toFixed(2)}`;

interface Props {
  item: LineItem | null;
  multiItems?: LineItem[] | null;
  people: Participant[];
  onClose: () => void;
  onApply: (assignedTo: string[]) => void;
}

export function AssignSheet({ item, multiItems, people, onClose, onApply }: Props) {
  const target = item ?? multiItems?.[0] ?? null;
  const initialIds = target
    ? (target.assignedTo.length === 0 ? people.map((p) => p.id) : target.assignedTo)
    : people.map((p) => p.id);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));

  const toggle = (pid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(pid)) n.delete(pid); else n.add(pid);
      return n;
    });
  };
  const setAll = () => setSelected(new Set(people.map((p) => p.id)));
  const setNone = () => setSelected(new Set());
  const setOnlyMe = () => {
    const me = people.find((p) => p.me);
    setSelected(new Set(me ? [me.id] : []));
  };

  const allSelected = selected.size === people.length;
  const noneSelected = selected.size === 0;

  const totalCents = multiItems
    ? multiItems.reduce((s, it) => s + it.priceCents, 0)
    : (target?.priceCents ?? 0);
  const perHead = selected.size > 0 ? totalCents / selected.size : 0;

  const apply = () => {
    const ids = allSelected ? [] : Array.from(selected);
    onApply(ids);
  };

  const title = multiItems
    ? `${multiItems.length} items selected`
    : (target?.name ?? "");

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="sheet-title">Who had this?</div>
            <div className="sheet-sub">{title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-pixel), 'Press Start 2P', monospace", fontSize: 14, color: "var(--gold)", textShadow: "0 0 6px rgba(255,212,71,0.4)" }}>
              {fmt(totalCents)}
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2 }}>total</div>
          </div>
        </div>

        <div className={`assign-grid ${people.length > 6 ? "dense" : ""}`}>
          {people.map((p) => {
            const on = selected.has(p.id);
            return (
              <div key={p.id} className={`assign-chip ${on ? "on" : "off"}`} onClick={() => toggle(p.id)}>
                <AvatarDot name={p.name} hue={p.hue} size={26} />
                <div className="name">{p.name}{p.me ? " (you)" : ""}</div>
                <div className="check">{on ? "✓" : ""}</div>
              </div>
            );
          })}
        </div>

        <div className="quick-row">
          <div className="quick" onClick={setAll}>ALL {people.length}</div>
          <div className="quick" onClick={setOnlyMe}>JUST ME</div>
          <div className="quick" onClick={setNone}>CLEAR</div>
        </div>

        <div className="sheet-price-hint">
          <span>
            {noneSelected ? "Pick at least one" :
              allSelected ? "Shared by everyone" :
              selected.size === 1 ? "Individual item" :
              `Split between ${selected.size}`}
          </span>
          {!noneSelected && <span className="split-each">{fmt(perHead)} each</span>}
        </div>

        <button className="sheet-cta" onClick={apply} disabled={noneSelected}>
          ▸ {multiItems ? `APPLY TO ${multiItems.length} ITEMS` : "CONFIRM SPLIT"}
        </button>
      </div>
    </>
  );
}
