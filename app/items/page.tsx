"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSplitStore } from "@/store/splitStore";
import { StepHeader } from "@/components/ui/StepHeader";
import { Button } from "@/components/ui/Button";
import { ItemTile } from "@/components/items/ItemTile";
import { AssignmentSheet } from "@/components/items/AssignmentSheet";
import { useToast } from "@/components/ui/Toast";
import { formatCents, itemsTotal } from "@/lib/calculations";
import type { LineItem } from "@/types";

export default function ItemsPage() {
  const router = useRouter();
  const { show: showToast } = useToast();

  const participants = useSplitStore((s) => s.participants);
  const lineItems = useSplitStore((s) => s.lineItems);
  const addLineItem = useSplitStore((s) => s.addLineItem);
  const updateLineItem = useSplitStore((s) => s.updateLineItem);
  const removeLineItem = useSplitStore((s) => s.removeLineItem);
  const assignItem = useSplitStore((s) => s.assignItem);

  const [sheetItem, setSheetItem] = useState<LineItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);

  // Guard: need participants
  useEffect(() => {
    if (participants.length === 0) router.replace("/group");
  }, [participants, router]);

  const deletedRef = useRef<{ item: LineItem; index: number } | null>(null);

  const handleDelete = (item: LineItem, index: number) => {
    deletedRef.current = { item, index };
    removeLineItem(item.id);
    showToast(`"${item.name}" removed`, {
      label: "UNDO",
      onClick: () => {
        if (deletedRef.current) {
          addLineItem(deletedRef.current.item);
        }
      },
    });
  };

  const handleAddItem = () => {
    addLineItem({ name: "New Item", priceCents: 0, assignedTo: [] });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchAssign = (itemId: string, participantIds: string[]) => {
    // itemId is ignored for batch — we apply to all selected
    for (const id of selectedIds) {
      assignItem(id, participantIds);
    }
    setSelectedIds(new Set());
    setBatchSheetOpen(false);
  };

  const total = itemsTotal(lineItems);
  const isMultiSelect = selectedIds.size > 0;

  // Create a dummy item for the batch assignment sheet
  const batchDummyItem: LineItem | null =
    selectedIds.size > 0
      ? {
          id: "__batch__",
          name: `${selectedIds.size} ITEMS`,
          priceCents: 0,
          assignedTo: [],
        }
      : null;

  return (
    <main className="flex flex-col min-h-screen bg-bg">
      <StepHeader
        title={isMultiSelect ? `${selectedIds.size} SELECTED` : "REVIEW ITEMS"}
        step={2}
        totalSteps={4}
        showBack
        backHref="/group"
      />

      {/* Multi-select toolbar */}
      <AnimatePresence>
        {isMultiSelect && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-surface border-b border-dashed border-orange overflow-hidden"
          >
            <button
              onClick={() => setBatchSheetOpen(true)}
              className="font-heading text-xs text-orange hover:brightness-110"
            >
              ASSIGN ALL →
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="font-heading text-xs text-muted hover:text-text ml-auto"
            >
              CLEAR
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto">
        {lineItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-5xl" aria-hidden>🧾</span>
            <p className="font-heading text-sm text-muted text-center">
              NO ITEMS YET
            </p>
            <p className="font-body text-xs text-muted text-center max-w-[220px]">
              The bill was empty. Add items manually below.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {lineItems.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.15 }}
              >
                <ItemTile
                  item={item}
                  participants={participants}
                  selected={selectedIds.has(item.id)}
                  onTap={() => {
                    if (isMultiSelect) toggleSelect(item.id);
                    else setSheetItem(item);
                  }}
                  onLongPress={() => toggleSelect(item.id)}
                  onDelete={() => handleDelete(item, idx)}
                  onUpdateName={(name) => updateLineItem(item.id, { name })}
                  onUpdatePrice={(priceCents) =>
                    updateLineItem(item.id, { priceCents })
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Add item */}
        <div className="px-4 py-3">
          <button
            onClick={handleAddItem}
            className="w-full font-heading text-xs text-muted border border-dashed border-border py-3 hover:border-orange hover:text-orange transition-colors"
          >
            + ADD ITEM
          </button>
        </div>
      </div>

      {/* Footer: total + CTA */}
      <div className="px-4 pb-8 pt-4 border-t border-dashed border-border bg-bg">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading text-xs text-muted">ITEMS TOTAL</span>
          <span className="font-heading text-lg text-text">{formatCents(total)}</span>
        </div>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={lineItems.length === 0}
          onClick={() => router.push("/extras")}
        >
          BILL EXTRAS →
        </Button>
      </div>

      {/* Single item assignment sheet */}
      <AssignmentSheet
        open={!!sheetItem}
        item={sheetItem}
        participants={participants}
        onClose={() => setSheetItem(null)}
        onConfirm={(itemId, ids) => assignItem(itemId, ids)}
      />

      {/* Batch assignment sheet */}
      <AssignmentSheet
        open={batchSheetOpen}
        item={batchDummyItem}
        participants={participants}
        onClose={() => setBatchSheetOpen(false)}
        onConfirm={handleBatchAssign}
      />
    </main>
  );
}
