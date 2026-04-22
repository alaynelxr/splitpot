"use client";

import { useState, useRef, useCallback } from "react";
import type { LineItem, Participant } from "@/types";
import { AvatarDot } from "./AvatarDot";
import { Crab, Prawn, Mushroom, Tofu, Chili, Egg, HotPot } from "./PixelArt";

const fmt = (cents: number) => `S$${(cents / 100).toFixed(2)}`;

function ItemIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("beef") || n.includes("chili") || n.includes("spicy")) return <Chili px={1.3} />;
  if (n.includes("prawn") || n.includes("shrimp") || n.includes("paste")) return <Prawn px={1.3} />;
  if (n.includes("mushroom") || n.includes("enoki")) return <Mushroom px={1.3} />;
  if (n.includes("tofu") || n.includes("bean curd")) return <Tofu px={1.3} />;
  if (n.includes("crab") || n.includes("stick")) return <Crab px={1.3} />;
  if (n.includes("egg") || n.includes("beer") || n.includes("juice") || n.includes("drink")) return <Egg px={1.3} />;
  if (n.includes("broth") || n.includes("soup") || n.includes("pot") || n.includes("base")) return <HotPot px={1.3} />;
  return <Mushroom px={1.3} />;
}

interface Props {
  item: LineItem;
  people: Participant[];
  selected: boolean;
  multiSelectMode: boolean;
  onOpenSheet: (id: string) => void;
  onOpenFix: (id: string) => void;
  onEdit: (id: string, patch: Partial<LineItem>) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string, force?: boolean) => void;
}

export function ItemRow({
  item, people, selected, multiSelectMode,
  onOpenSheet, onOpenFix, onEdit, onDelete, onToggleSelect,
}: Props) {
  const [swipeX, setSwipeX] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const startX = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressedRef = useRef(false);

  const assignedIds = item.assignedTo.length === 0 ? people.map((p) => p.id) : item.assignedTo;
  const isAll = item.assignedTo.length === 0;
  const isSolo = !isAll && assignedIds.length === 1;
  const isCustom = !isAll && assignedIds.length > 1;
  const visiblePeople = assignedIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as Participant[];

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
    pressedRef.current = true;
    longPressTimer.current = setTimeout(() => {
      if (pressedRef.current) {
        onToggleSelect(item.id, true);
        navigator.vibrate?.(30);
      }
    }, 450);
  }, [item.id, onToggleSelect]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 8) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      pressedRef.current = false;
    }
    if (dx < 0) setSwipeX(Math.max(dx, -90));
    else setSwipeX(0);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    const wasLong = !pressedRef.current;
    pressedRef.current = false;
    if (swipeX < -60) {
      onDelete(item.id);
      setSwipeX(0);
      startX.current = null;
      return;
    }
    setSwipeX(0);
    if (!wasLong && startX.current !== null) {
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) < 5 && !editingName && !editingPrice) {
        if (multiSelectMode) onToggleSelect(item.id);
        else if (item.unclear) onOpenFix(item.id);
        else onOpenSheet(item.id);
      }
    }
    startX.current = null;
  }, [swipeX, item, editingName, editingPrice, multiSelectMode, onDelete, onToggleSelect, onOpenFix, onOpenSheet]);

  const HUE_BG: Record<string, string> = {
    mint: "var(--mint)", pink: "var(--pink)", gold: "var(--gold)", violet: "var(--violet)",
  };

  return (
    <div className="item-swipe-wrap">
      <div className="delete-bg">DELETE</div>
      <div
        className={`item ${selected ? "selected" : ""} ${isSolo ? "individual" : ""} ${item.unclear ? "unclear" : ""}`}
        style={{ transform: `translateX(${swipeX}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          setSwipeX(0); startX.current = null; pressedRef.current = false;
        }}
      >
        {multiSelectMode && (
          <div style={{
            width: 18, height: 18, borderRadius: 3, flexShrink: 0,
            border: `1.5px solid ${selected ? "var(--pink)" : "var(--ink-faint)"}`,
            background: selected ? "var(--pink)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--bg)", fontSize: 10,
            fontFamily: "var(--font-pixel), 'Press Start 2P', monospace",
          }}>{selected ? "✓" : ""}</div>
        )}

        <div style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ItemIcon name={item.name} />
        </div>

        <div className="item-body">
          <div className="item-name">
            {editingName ? (
              <input
                autoFocus
                defaultValue={item.name}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onBlur={(e) => { onEdit(item.id, { name: e.target.value }); setEditingName(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              />
            ) : (
              <span
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
              >{item.name}</span>
            )}
          </div>
          <div className="item-meta">
            {item.unclear ? (
              <span className="badge badge-unclear">⚠ TAP TO FIX</span>
            ) : (
              <>
                {isAll && <span className="badge badge-all">ALL · {people.length}</span>}
                {isCustom && <span className="badge badge-custom">{assignedIds.length} PPL</span>}
                {isSolo && <span className="badge badge-solo">SOLO</span>}
                {!isAll && (
                  <div className="cluster" style={{ marginLeft: 2 }}>
                    {visiblePeople.slice(0, 4).map((p) => (
                      <div key={p.id} className="dot" style={{ background: HUE_BG[p.hue] }}>
                        {p.name[0].toUpperCase()}
                      </div>
                    ))}
                    {visiblePeople.length > 4 && (
                      <div className="dot more">+{visiblePeople.length - 4}</div>
                    )}
                  </div>
                )}
                {!isAll && !isSolo && (
                  <span style={{ color: "var(--ink-faint)", fontSize: 10 }}>
                    · {fmt(item.priceCents / assignedIds.length)}/ea
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className="item-price"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setEditingPrice(true); }}
        >
          {editingPrice ? (
            <input
              autoFocus
              type="number"
              step="0.01"
              defaultValue={(item.priceCents / 100).toFixed(2)}
              onBlur={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v)) onEdit(item.id, { priceCents: Math.round(v * 100) });
                setEditingPrice(false);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            />
          ) : fmt(item.priceCents)}
        </div>
      </div>
    </div>
  );
}
