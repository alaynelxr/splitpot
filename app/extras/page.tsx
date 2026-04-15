"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { StepHeader } from "@/components/ui/StepHeader";
import { Button } from "@/components/ui/Button";
import { formatCents, itemsTotal } from "@/lib/calculations";
import type { DiscountType, DiscountTiming } from "@/types";

export default function ExtrasPage() {
  const router = useRouter();
  const extras = useSplitStore((s) => s.extras);
  const lineItems = useSplitStore((s) => s.lineItems);
  const setExtras = useSplitStore((s) => s.setExtras);
  const computeSplits = useSplitStore((s) => s.computeSplits);

  const [svcPct, setSvcPct] = useState(String(extras.serviceChargePct || ""));
  const [gstPct, setGstPct] = useState(String(extras.gstPct || ""));
  const [discountVal, setDiscountVal] = useState(String(extras.discountValue || ""));
  const [discountType, setDiscountType] = useState<DiscountType>(extras.discountType);
  const [discountTiming, setDiscountTiming] = useState<DiscountTiming>(extras.discountTiming);

  const subtotal = itemsTotal(lineItems);
  const svcNum = parseFloat(svcPct) || 0;
  const gstNum = parseFloat(gstPct) || 0;
  const discNum = parseFloat(discountVal) || 0;

  // Running preview calculation (cents)
  const discBefore = discountTiming === "before_tax"
    ? (discountType === "flat" ? Math.round(discNum * 100) : Math.round(subtotal * discNum / 100))
    : 0;
  const taxBase = subtotal - discBefore;
  const svcCents = Math.round(taxBase * svcNum / 100);
  const gstCents = Math.round((taxBase + svcCents) * gstNum / 100);
  const discAfter = discountTiming === "after_tax"
    ? (discountType === "flat" ? Math.round(discNum * 100) : Math.round((subtotal + svcCents + gstCents) * discNum / 100))
    : 0;
  const preview = subtotal + svcCents + gstCents - discBefore - discAfter;

  const handleCalculate = () => {
    setExtras({
      serviceChargePct: parseFloat(svcPct) || 0,
      gstPct: parseFloat(gstPct) || 0,
      discountValue: parseFloat(discountVal) || 0,
      discountType,
      discountTiming,
    });
    computeSplits();
    router.push("/summary");
  };

  return (
    <main className="flex flex-col min-h-screen bg-bg">
      <StepHeader title="BILL EXTRAS" step={3} totalSteps={4} showBack backHref="/items" />

      <div className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto">
        {/* Service charge */}
        <FieldRow
          label="SERVICE CHARGE"
          sublabel="usually 10%"
          value={svcPct}
          onChange={setSvcPct}
          suffix="%"
          placeholder="0"
        />

        {/* GST */}
        <FieldRow
          label="GST"
          sublabel="currently 9% in SG"
          value={gstPct}
          onChange={setGstPct}
          suffix="%"
          placeholder="0"
        />

        {/* Divider */}
        <div className="border-t border-dashed border-border" />

        {/* Discount */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="font-heading text-xs text-muted">DISCOUNT</span>
            {/* Type toggle */}
            <div className="flex">
              {(["flat", "percent"] as DiscountType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDiscountType(t)}
                  className={[
                    "font-heading text-xs px-3 py-1.5 border border-dashed transition-colors",
                    discountType === t
                      ? "bg-orange text-bg border-orange"
                      : "text-muted border-border hover:border-orange hover:text-orange",
                  ].join(" ")}
                >
                  {t === "flat" ? "$ FLAT" : "% RATE"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 bg-surface border border-dashed border-border px-3 py-3">
              <span className="font-heading text-sm text-muted">
                {discountType === "flat" ? "$" : "%"}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent font-heading text-sm text-text outline-none"
                aria-label="Discount value"
              />
            </div>
          </div>

          {/* Discount timing */}
          {discNum > 0 && (
            <div className="flex gap-2">
              {(["before_tax", "after_tax"] as DiscountTiming[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDiscountTiming(t)}
                  className={[
                    "flex-1 font-heading text-xs px-2 py-2 border border-dashed transition-colors",
                    discountTiming === t
                      ? "bg-orange/10 border-orange text-orange"
                      : "text-muted border-border hover:border-muted",
                  ].join(" ")}
                >
                  {t === "before_tax" ? "BEFORE TAX" : "AFTER TAX"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="bg-surface border border-dashed border-border p-4 flex flex-col gap-2">
          <p className="font-heading text-xs text-muted tracking-wider mb-1">PREVIEW</p>
          <PreviewRow label="Items subtotal" valueCents={subtotal} />
          {svcCents !== 0 && (
            <PreviewRow label={`Service charge (${svcNum}%)`} valueCents={svcCents} />
          )}
          {gstCents !== 0 && (
            <PreviewRow label={`GST (${gstNum}%)`} valueCents={gstCents} />
          )}
          {(discBefore !== 0 || discAfter !== 0) && (
            <PreviewRow
              label={`Discount${discountTiming === "before_tax" ? " (before tax)" : " (after tax)"}`}
              valueCents={-(discBefore + discAfter)}
            />
          )}
          <div className="border-t border-dashed border-border pt-2 mt-1 flex items-center justify-between">
            <span className="font-heading text-xs text-text">GRAND TOTAL</span>
            <span className="font-heading text-lg text-orange">{formatCents(preview)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 pt-4 border-t border-dashed border-border">
        <Button variant="primary" size="lg" fullWidth onClick={handleCalculate}>
          CALCULATE SPLIT →
        </Button>
      </div>
    </main>
  );
}

function FieldRow({
  label,
  sublabel,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-xs text-muted">{label}</span>
        {sublabel && (
          <span className="font-body text-xs text-muted/60">{sublabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2 bg-surface border border-dashed border-border px-3 py-3">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent font-heading text-sm text-text outline-none"
          aria-label={label}
        />
        {suffix && (
          <span className="font-heading text-sm text-muted">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function PreviewRow({ label, valueCents }: { label: string; valueCents: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body text-xs text-muted">{label}</span>
      <span
        className={[
          "font-heading text-xs",
          valueCents < 0 ? "text-green" : "text-text",
        ].join(" ")}
      >
        {valueCents < 0 ? `-${formatCents(-valueCents)}` : formatCents(valueCents)}
      </span>
    </div>
  );
}
