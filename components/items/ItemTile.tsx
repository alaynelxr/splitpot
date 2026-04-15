"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { AvatarCluster } from "@/components/ui/AvatarChip";
import { formatCents, parseDollarString } from "@/lib/calculations";
import type { LineItem, Participant } from "@/types";

interface ItemTileProps {
  item: LineItem;
  participants: Participant[];
  selected: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
  onUpdatePrice: (priceCents: number) => void;
}

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -140;

export function ItemTile({
  item,
  participants,
  selected,
  onTap,
  onLongPress,
  onDelete,
  onUpdateName,
  onUpdatePrice,
}: ItemTileProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [nameValue, setNameValue] = useState(item.name);
  const [priceValue, setPriceValue] = useState(
    (item.priceCents / 100).toFixed(2)
  );
  const [swiped, setSwiped] = useState(false);

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [SWIPE_THRESHOLD, DELETE_THRESHOLD], [0.4, 1]);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDragEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (x.get() < DELETE_THRESHOLD) {
      // Snap to delete
      animate(x, -300, { duration: 0.2 });
      setTimeout(onDelete, 200);
    } else if (x.get() < SWIPE_THRESHOLD) {
      setSwiped(true);
      animate(x, SWIPE_THRESHOLD, { duration: 0.15 });
    } else {
      setSwiped(false);
      animate(x, 0, { duration: 0.2 });
    }
  };

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== item.name) onUpdateName(trimmed);
    else setNameValue(item.name);
    setEditingName(false);
  };

  const commitPrice = () => {
    const cents = parseDollarString(priceValue);
    if (cents !== null && cents > 0 && cents !== item.priceCents) {
      onUpdatePrice(cents);
    } else {
      setPriceValue((item.priceCents / 100).toFixed(2));
    }
    setEditingPrice(false);
  };

  const tileBackground = selected ? "bg-orange/10 border-orange" : "bg-surface border-border";

  return (
    <div className="relative overflow-hidden">
      {/* Delete indicator behind tile */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-pink"
        style={{ opacity: deleteOpacity, left: 0 }}
      >
        <span className="font-heading text-xs text-bg">DELETE</span>
      </motion.div>

      {/* Main tile */}
      <motion.div
        className={`relative flex flex-col gap-1 px-4 py-3 border border-dashed ${tileBackground} cursor-pointer select-none`}
        style={{ x }}
        drag="x"
        dragConstraints={{ right: 0, left: -200 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (!editingName && !editingPrice && !swiped) onTap();
          setSwiped(false);
        }}
      >
        {/* Row 1: name + price */}
        <div className="flex items-center gap-3">
          {/* Name */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") { setNameValue(item.name); setEditingName(false); }
                }}
                className="w-full bg-transparent font-body text-sm text-text outline-none border-b border-dashed border-orange"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="font-body text-sm text-text truncate block"
                onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
              >
                {item.name}
              </span>
            )}
          </div>

          {/* Price */}
          {editingPrice ? (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="font-heading text-sm text-muted">$</span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitPrice();
                  if (e.key === "Escape") { setPriceValue((item.priceCents / 100).toFixed(2)); setEditingPrice(false); }
                }}
                className="w-16 bg-transparent font-heading text-sm text-orange text-right outline-none border-b border-dashed border-orange"
              />
            </div>
          ) : (
            <span
              className="font-heading text-sm text-orange shrink-0"
              onDoubleClick={(e) => { e.stopPropagation(); setEditingPrice(true); }}
            >
              {formatCents(item.priceCents)}
            </span>
          )}
        </div>

        {/* Row 2: assignment + edit hint */}
        <div className="flex items-center justify-between">
          <AvatarCluster
            participants={participants}
            assignedIds={item.assignedTo}
            allCount={participants.length}
          />
          <span className="font-heading text-[10px] text-border">tap to assign ›</span>
        </div>
      </motion.div>

      {/* Swipe-revealed delete button */}
      {swiped && (
        <div className="absolute right-0 inset-y-0 flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="h-full px-5 bg-pink font-heading text-xs text-bg hover:brightness-110 transition-colors"
          >
            DELETE
          </button>
        </div>
      )}
    </div>
  );
}
