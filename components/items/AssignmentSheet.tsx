"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/calculations";
import type { LineItem, Participant } from "@/types";

interface AssignmentSheetProps {
  open: boolean;
  item: LineItem | null;
  participants: Participant[];
  onClose: () => void;
  onConfirm: (itemId: string, participantIds: string[]) => void;
}

export function AssignmentSheet({
  open,
  item,
  participants,
  onClose,
  onConfirm,
}: AssignmentSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Initialise selection when item changes
  useEffect(() => {
    if (!item) return;
    if (item.assignedTo.length === 0) {
      setSelected(new Set(participants.map((p) => p.id)));
    } else {
      setSelected(new Set(item.assignedTo));
    }
  }, [item, participants]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Don't allow deselecting the last person
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(participants.map((p) => p.id)));

  const handleConfirm = () => {
    if (!item) return;
    onConfirm(item.id, Array.from(selected));
    onClose();
  };

  if (!item) return null;

  const isAll = selected.size === participants.length;

  return (
    <BottomSheet open={open} onClose={onClose} title={item.name}>
      <div className="px-4 pt-3 pb-6 flex flex-col gap-5">
        {/* Price + assignment label */}
        <div className="flex items-center justify-between">
          <span className="font-heading text-xl text-orange">
            {formatCents(item.priceCents)}
          </span>
          <button
            onClick={selectAll}
            className="font-heading text-xs text-muted hover:text-green transition-colors"
          >
            {isAll ? "✓ ALL SELECTED" : "SELECT ALL"}
          </button>
        </div>

        {/* Per-person share preview */}
        {selected.size > 0 && (
          <p className="font-heading text-xs text-muted">
            {formatCents(Math.ceil(item.priceCents / selected.size))} / person
          </p>
        )}

        {/* Participant grid */}
        <div className="grid grid-cols-4 gap-4">
          {participants.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className="flex flex-col items-center gap-1 py-2 transition-all duration-120 min-h-[72px]"
              aria-pressed={selected.has(p.id)}
              aria-label={`${selected.has(p.id) ? "Remove" : "Add"} ${p.name}`}
            >
              <AvatarChip
                name={p.name}
                color={p.color}
                size="lg"
                active={selected.has(p.id)}
                showName
              />
            </button>
          ))}
        </div>

        {/* Confirm */}
        <Button variant="primary" size="lg" fullWidth onClick={handleConfirm}>
          DONE — ASSIGN TO {selected.size === participants.length ? "ALL" : `${selected.size}`}
        </Button>
      </div>
    </BottomSheet>
  );
}
