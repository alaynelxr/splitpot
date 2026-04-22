"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { TopBar } from "@/components/TopBar";
import { itemsTotal } from "@/lib/calculations";
import type { DiscountType, DiscountTiming } from "@/types";

export default function ExtrasPage() {
  const router = useRouter();
  const extras = useSplitStore((s) => s.extras);
  const lineItems = useSplitStore((s) => s.lineItems);
  const participants = useSplitStore((s) => s.participants);
  const restaurantName = useSplitStore((s) => s.restaurantName);
  const setExtras = useSplitStore((s) => s.setExtras);
  const computeSplits = useSplitStore((s) => s.computeSplits);

  const [svcPct, setSvcPct] = useState("10");
  const [gstPct, setGstPct] = useState("9");
  const [discountVal, setDiscountVal] = useState(String(extras.discountValue || ""));
  const [discountType, setDiscountType] = useState<DiscountType>(extras.discountType);
  const [discountTiming, setDiscountTiming] = useState<DiscountTiming>(extras.discountTiming);

  const subtotal = itemsTotal(lineItems);
  const svcNum = parseFloat(svcPct) || 0;
  const gstNum = parseFloat(gstPct) || 0;
  const discNum = parseFloat(discountVal) || 0;

  const discBefore = discountTiming === "before_tax"
    ? (discountType === "flat" ? Math.round(discNum * 100) : Math.round(subtotal * discNum / 100))
    : 0;
  const taxable = subtotal - discBefore;
  const svcCents = Math.round(taxable * svcNum / 100);
  const gstCents = Math.round((taxable + svcCents) * gstNum / 100);
  const discAfter = discountTiming === "after_tax"
    ? (discountType === "flat" ? Math.round(discNum * 100) : Math.round((subtotal + svcCents + gstCents) * discNum / 100))
    : 0;
  const preview = subtotal + svcCents + gstCents - discBefore - discAfter;

  const fmt = (c: number) => `S$${(Math.abs(c) / 100).toFixed(2)}`;

  const handleCalculate = () => {
    setExtras({
      serviceChargePct: svcNum,
      gstPct: gstNum,
      discountValue: discNum,
      discountType,
      discountTiming,
    });
    computeSplits();
    router.push("/summary");
  };

  return (
    <div className="app scanlines" style={{ position: "relative" }}>
      <TopBar step={5} onBack={() => router.push("/items")} billName={restaurantName} />

      <div className="extras">
        {/* Live totals preview */}
        <div className="totals-card">
          {svcCents !== 0 && (
            <div className="totals-line add">
              <span>Service charge ({svcNum}%)</span>
              <span className="v">+{fmt(svcCents)}</span>
            </div>
          )}
          {gstCents !== 0 && (
            <div className="totals-line add">
              <span>GST ({gstNum}%)</span>
              <span className="v">+{fmt(gstCents)}</span>
            </div>
          )}
          {(discBefore + discAfter) !== 0 && (
            <div className="totals-line sub-amt">
              <span>Discount</span>
              <span className="v">−{fmt(discBefore + discAfter)}</span>
            </div>
          )}
          <div className="totals-divider" />
          <div className="totals-line grand">
            <span>GRAND TOTAL</span>
            <span className="v">{fmt(preview)}</span>
          </div>
        </div>

        {/* Service charge */}
        <div className="extras-card">
          <div className="card-head">
            <div className="card-title">SERVICE CHARGE</div>
            {svcNum > 0 && <div className="card-detect">{fmt(svcCents)}</div>}
          </div>
          <div className="pct-row">
            <div className="pct-input-wrap">
              <input
                className="pct-input"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={svcPct}
                onChange={(e) => setSvcPct(e.target.value)}
                placeholder="0"
              />
              <span className="pct-suffix">%</span>
            </div>
            {svcNum > 0 && <div className="pct-impact pos">+{fmt(svcCents)}</div>}
          </div>
        </div>

        {/* GST */}
        <div className="extras-card">
          <div className="card-head">
            <div className="card-title">GST</div>
            {gstNum > 0 && <div className="card-detect">{fmt(gstCents)}</div>}
          </div>
          <div className="pct-row">
            <div className="pct-input-wrap">
              <input
                className="pct-input"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={gstPct}
                onChange={(e) => setGstPct(e.target.value)}
                placeholder="0"
              />
              <span className="pct-suffix">%</span>
            </div>
            {gstNum > 0 && <div className="pct-impact pos">+{fmt(gstCents)}</div>}
          </div>
        </div>

        {/* Discount */}
        <div className="extras-card">
          <div className="card-head">
            <div className="card-title">DISCOUNT</div>
            {discNum > 0 && <div className="card-detect neg">{fmt(discBefore + discAfter)} off</div>}
          </div>
          <div className="seg-row">
            <div className="seg">
              <div className={`s-opt ${discountType === "flat" ? "on" : ""}`} onClick={() => setDiscountType("flat")}>$ FLAT</div>
              <div className={`s-opt ${discountType === "percent" ? "on" : ""}`} onClick={() => setDiscountType("percent")}>% RATE</div>
            </div>
          </div>
          <div className="pct-row">
            <div className="pct-input-wrap">
              <input
                className="pct-input"
                type="number"
                inputMode="decimal"
                min="0"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                placeholder="0"
              />
              <span className="pct-suffix">{discountType === "flat" ? "SGD" : "%"}</span>
            </div>
            {discNum > 0 && <div className="pct-impact neg">−{fmt(discBefore + discAfter)}</div>}
          </div>
          {discNum > 0 && (
            <div className="toggle-row" style={{ marginTop: 8 }}>
              <div className="t-label">Apply timing</div>
              <div className="pill-switch">
                <div className={`opt ${discountTiming === "before_tax" ? "on" : ""}`} onClick={() => setDiscountTiming("before_tax")}>BEFORE TAX</div>
                <div className={`opt ${discountTiming === "after_tax" ? "on" : ""}`} onClick={() => setDiscountTiming("after_tax")}>AFTER TAX</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-bar">
        <div className="cta-row">
          <button className="cta cta-ghost" onClick={() => router.push("/items")} style={{ flex: "0 0 auto", padding: "14px 16px" }}>◂</button>
          <button
            className="cta"
            onClick={handleCalculate}
            disabled={lineItems.length === 0 || participants.length === 0}
          >
            ▸ CALCULATE SPLIT
          </button>
        </div>
      </div>
    </div>
  );
}
