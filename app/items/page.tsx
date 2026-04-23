"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { TopBar } from "@/components/TopBar";
import { PeopleRow } from "@/components/PeopleRow";
import { ItemRow } from "@/components/ItemRow";
import { AssignSheet } from "@/components/AssignSheet";
import { FixSheet } from "@/components/FixSheet";
import type { LineItem } from "@/types";

function perPersonTotals(items: LineItem[], allIds: string[]): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(allIds.map((id) => [id, 0]));
  items.forEach((it) => {
    const ids = it.assignedTo.length === 0 ? allIds : it.assignedTo;
    if (!ids.length) return;
    const share = it.priceCents / ids.length;
    ids.forEach((id) => { if (totals[id] !== undefined) totals[id] += share; });
  });
  return totals;
}

export default function ItemsPage() {
  const router = useRouter();
  const participants = useSplitStore((s) => s.participants);
  const lineItems = useSplitStore((s) => s.lineItems);
  const restaurantName = useSplitStore((s) => s.restaurantName);
  const receiptDate = useSplitStore((s) => s.receiptDate);
  const addLineItem = useSplitStore((s) => s.addLineItem);
  const updateLineItem = useSplitStore((s) => s.updateLineItem);
  const removeLineItem = useSplitStore((s) => s.removeLineItem);
  const assignItem = useSplitStore((s) => s.assignItem);

  const [sheetItemId, setSheetItemId] = useState<string | null>(null);
  const [fixItemId, setFixItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiSheetOpen, setMultiSheetOpen] = useState(false);

  useEffect(() => {
    if (participants.length === 0) router.replace("/group");
  }, [participants, router]);

  const subtotal = useMemo(() => lineItems.reduce((s, it) => s + it.priceCents, 0), [lineItems]);
  const totals = useMemo(
    () => perPersonTotals(lineItems, participants.map((p) => p.id)),
    [lineItems, participants]
  );

  const multiSelectMode = selectedIds.size > 0;
  const sheetItem = lineItems.find((it) => it.id === sheetItemId) ?? null;
  const fixItem = lineItems.find((it) => it.id === fixItemId) ?? null;
  const multiItems = multiSheetOpen ? lineItems.filter((it) => selectedIds.has(it.id)) : null;
  const hasUnclear = lineItems.some((it) => it.unclear);

  const toggleSelect = (id: string, force = false) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id) && !force) n.delete(id); else n.add(id);
      return n;
    });
  };

  const applyAssignment = (assignedTo: string[]) => {
    if (multiSheetOpen) {
      selectedIds.forEach((id) => assignItem(id, assignedTo));
      setMultiSheetOpen(false);
      setSelectedIds(new Set());
    } else if (sheetItemId) {
      assignItem(sheetItemId, assignedTo);
      setSheetItemId(null);
    }
  };

  return (
    <div className="app scanlines" style={{ position: "relative" }}>
      <TopBar subtotal={subtotal} step={4} onBack={() => router.push("/group")} billName={restaurantName} receiptDate={receiptDate} />
      <PeopleRow people={participants} totals={totals} />

      {multiSelectMode && (
        <div className="multi-banner">
          <span>▸ {selectedIds.size} SELECTED</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setMultiSheetOpen(true)}>ASSIGN →</button>
            <button onClick={() => setSelectedIds(new Set())}>CANCEL</button>
          </div>
        </div>
      )}

      <div className="items-scroll">
        <div className="items-heading">
          <div className="heading-row">
            <div className="title">▸ LINE ITEMS</div>
            <div className="count">{lineItems.length}</div>
          </div>
          <div className="hint">tap icon to assign · long-press to batch</div>
        </div>

        {hasUnclear && (
          <div className="partial-banner">
            <span className="tag">OCR</span>
            <span>{lineItems.filter((i) => i.unclear).length} lines unclear · tap to fix</span>
          </div>
        )}

        {lineItems.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            people={participants}
            selected={selectedIds.has(it.id)}
            multiSelectMode={multiSelectMode}
            onOpenSheet={setSheetItemId}
            onOpenFix={setFixItemId}
            onEdit={(id, patch) => updateLineItem(id, patch)}
            onDelete={removeLineItem}
            onToggleSelect={toggleSelect}
          />
        ))}

        <div style={{ height: 10 }} />
      </div>

      <div className="bottom-bar">
        <div style={{ fontSize: 10, color: "var(--ink-faint)", textAlign: "center", paddingBottom: 6 }}>
          Service charge &amp; GST applied at next step
        </div>
        <div className="cta-row">
          <button className="cta cta-ghost" style={{ flex: 1 }} onClick={() => addLineItem({ name: "New Item", priceCents: 0, assignedTo: [] })}>+ ADD ITEM</button>
          <button className="cta" style={{ flex: 1 }} onClick={() => router.push("/extras")}>▸ BILL EXTRAS</button>
        </div>
      </div>

      {sheetItem && (
        <AssignSheet
          item={sheetItem}
          people={participants}
          onClose={() => setSheetItemId(null)}
          onApply={applyAssignment}
          onDelete={() => { removeLineItem(sheetItem.id); setSheetItemId(null); }}
        />
      )}
      {fixItem && (
        <FixSheet
          item={fixItem}
          onClose={() => setFixItemId(null)}
          onApply={(patch) => { updateLineItem(fixItem.id, patch); setFixItemId(null); }}
          onDelete={() => removeLineItem(fixItem.id)}
        />
      )}
      {multiSheetOpen && multiItems && multiItems.length > 0 && (
        <AssignSheet multiItems={multiItems} people={participants} item={null} onClose={() => setMultiSheetOpen(false)} onApply={applyAssignment} />
      )}
    </div>
  );
}
