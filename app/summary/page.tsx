"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSplitStore } from "@/store/splitStore";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatCents } from "@/lib/calculations";
import { formatSummaryText } from "@/lib/format";
import type { PersonSplit } from "@/types";

export default function SummaryPage() {
  const router = useRouter();
  const { show: showToast } = useToast();

  const splits = useSplitStore((s) => s.splits);
  const participants = useSplitStore((s) => s.participants);
  const lineItems = useSplitStore((s) => s.lineItems);
  const extras = useSplitStore((s) => s.extras);
  const restaurantName = useSplitStore((s) => s.restaurantName);
  const date = useSplitStore((s) => s.date);
  const reset = useSplitStore((s) => s.reset);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (splits.length === 0) router.replace("/");
  }, [splits, router]);

  const grandTotal = splits.reduce((s, r) => s + r.totalCents, 0);

  const taxParts: string[] = [];
  if (extras.serviceChargePct > 0) taxParts.push(`${extras.serviceChargePct}% svc`);
  if (extras.gstPct > 0) taxParts.push(`${extras.gstPct}% GST`);

  const handleCopy = async () => {
    const text = formatSummaryText({
      restaurantName,
      date,
      splits,
      lineItems,
      extras,
      participantCount: participants.length,
    });
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!");
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      showToast("Copied to clipboard!");
    }
  };

  const handleScreenshot = async () => {
    setScreenshotMode(true);
    // Allow re-render before capturing
    await new Promise((r) => setTimeout(r, 100));
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(receiptRef.current!, {
        backgroundColor: "#1A1A2E",
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "splitpot-summary.png";
      link.href = dataUrl;
      link.click();
      showToast("Screenshot saved!");
    } catch {
      showToast("Screenshot failed — try copying instead.");
    } finally {
      setScreenshotMode(false);
    }
  };

  if (splits.length === 0) return null;

  return (
    <main className="flex flex-col min-h-screen bg-bg">
      {/* Header — hidden in screenshot mode */}
      {!screenshotMode && (
        <header className="flex items-center gap-3 px-4 py-4 border-b border-dashed border-border bg-bg">
          <div className="flex-1">
            <h1 className="font-heading font-bold text-sm text-text">SUMMARY</h1>
            <p className="font-heading text-[10px] text-muted mt-0.5">STEP 4/4</p>
          </div>
        </header>
      )}

      {/* Receipt card (captured for screenshot) */}
      <div
        ref={receiptRef}
        className="flex-1 flex flex-col px-4 py-6 gap-5"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        {/* SPLIT COMPLETE header */}
        <motion.div
          className="text-center py-4 border border-dashed border-green"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <p
            className="font-display text-green"
            style={{ fontSize: "16px", lineHeight: "2" }}
          >
            SPLIT COMPLETE
          </p>
          {restaurantName && (
            <p className="font-heading text-xs text-muted mt-1">{restaurantName}</p>
          )}
          <p className="font-heading text-xs text-muted">
            {new Date(date).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </motion.div>

        {/* Per-person cards */}
        <AnimatePresence>
          {splits.map((split, idx) => (
            <PersonCard
              key={split.participantId}
              split={split}
              idx={idx}
              expanded={expandedId === split.participantId}
              onToggle={() =>
                setExpandedId(
                  expandedId === split.participantId ? null : split.participantId
                )
              }
            />
          ))}
        </AnimatePresence>

        {/* Grand total */}
        <div className="border border-dashed border-orange p-4 flex flex-col gap-2 mt-2">
          {extras.serviceChargePct > 0 && (
            <div className="flex justify-between">
              <span className="font-body text-xs text-muted">
                Service charge ({extras.serviceChargePct}%)
              </span>
              <span className="font-heading text-xs text-muted">
                {formatCents(splits.reduce((s, r) => s + r.serviceChargeCents, 0))}
              </span>
            </div>
          )}
          {extras.gstPct > 0 && (
            <div className="flex justify-between">
              <span className="font-body text-xs text-muted">
                GST ({extras.gstPct}%)
              </span>
              <span className="font-heading text-xs text-muted">
                {formatCents(splits.reduce((s, r) => s + r.gstCents, 0))}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-border pt-2 mt-1">
            <span className="font-heading text-sm text-text">GRAND TOTAL</span>
            <span className="font-heading text-xl text-orange">
              {formatCents(grandTotal)}
            </span>
          </div>
          {taxParts.length > 0 && (
            <p className="font-body text-[10px] text-muted">
              Incl. {taxParts.join(" + ")}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons — hidden in screenshot mode */}
      {!screenshotMode && (
        <div className="px-4 pb-8 pt-4 border-t border-dashed border-border flex flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={handleCopy}>
            📋 COPY TO CLIPBOARD
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={handleScreenshot}>
            📸 SCREENSHOT
          </Button>
          <button
            onClick={() => { reset(); router.replace("/"); }}
            className="font-heading text-xs text-muted hover:text-text transition-colors py-2 text-center"
          >
            ↩ START NEW SPLIT
          </button>
        </div>
      )}
    </main>
  );
}

function PersonCard({
  split,
  idx,
  expanded,
  onToggle,
}: {
  split: PersonSplit;
  idx: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.25 }}
      className="border border-dashed bg-surface"
      style={{ borderColor: split.color }}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center font-heading text-xs font-bold text-bg shrink-0"
            style={{ backgroundColor: split.color }}
          >
            {split.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-heading text-sm text-text">{split.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="font-heading text-xl"
            style={{ color: split.color }}
          >
            {formatCents(split.totalCents)}
          </span>
          <span className="font-heading text-xs text-muted">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Breakdown — expandable */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-1 border-t border-dashed border-border">
              {split.sharedItems.map((si) => (
                <BreakdownRow key={si.name} label={si.name} cents={si.shareCents} dim />
              ))}
              {split.individualItems.map((ii) => (
                <BreakdownRow key={ii.name} label={`★ ${ii.name}`} cents={ii.priceCents} />
              ))}
              {split.serviceChargeCents > 0 && (
                <BreakdownRow label="Service charge" cents={split.serviceChargeCents} dim />
              )}
              {split.gstCents > 0 && (
                <BreakdownRow label="GST" cents={split.gstCents} dim />
              )}
              {split.discountCents > 0 && (
                <BreakdownRow label="Discount" cents={-split.discountCents} dim />
              )}
              <div className="flex justify-between pt-2 border-t border-dashed border-border mt-1">
                <span className="font-heading text-xs text-text">TOTAL</span>
                <span className="font-heading text-sm" style={{ color: split.color }}>
                  {formatCents(split.totalCents)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BreakdownRow({
  label,
  cents,
  dim = false,
}: {
  label: string;
  cents: number;
  dim?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline pt-2">
      <span
        className={["font-body text-xs truncate max-w-[200px]", dim ? "text-muted" : "text-text"].join(" ")}
      >
        {label}
      </span>
      <span
        className={["font-heading text-xs shrink-0 ml-2", cents < 0 ? "text-green" : dim ? "text-muted" : "text-text"].join(" ")}
      >
        {cents < 0 ? `-${formatCents(-cents)}` : formatCents(cents)}
      </span>
    </div>
  );
}
