"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { TopBar } from "@/components/TopBar";
import { AvatarDot } from "@/components/AvatarDot";
import type { PersonSplit } from "@/types";

const fmt = (cents: number) => `S$${(cents / 100).toFixed(2)}`;

function SummaryCard({ split, isMe }: { split: PersonSplit; isMe: boolean }) {
  const [expanded, setExpanded] = useState(isMe);

  return (
    <div className={`summary-card ${isMe ? "me" : ""}`} onClick={() => setExpanded((e) => !e)}>
      <div className="summary-card-head">
        <AvatarDot name={split.name} hue={split.hue} size={28} />
        <div className="summary-card-name">{split.name}{isMe ? " (you)" : ""}</div>
        <div className="summary-card-total">{fmt(split.totalCents)}</div>
      </div>

      {expanded && (
        <div style={{ marginTop: 4 }}>
          {split.individualItems.map((it) => (
            <div key={it.name} className="summary-item-line">
              <span className="item-name">{it.name}</span>
              <span>{fmt(it.priceCents)}</span>
            </div>
          ))}
          {split.sharedItems.map((it) => (
            <div key={it.name} className="summary-item-line">
              <span className="item-name">{it.name}</span>
              <span>{fmt(it.shareCents)}</span>
            </div>
          ))}
          {(split.serviceChargeCents > 0 || split.gstCents > 0) && (
            <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--surface-2)" }}>
              {split.serviceChargeCents > 0 && (
                <div className="summary-item-line" style={{ color: "var(--ink-faint)" }}>
                  <span className="item-name">Service charge</span>
                  <span>{fmt(split.serviceChargeCents)}</span>
                </div>
              )}
              {split.gstCents > 0 && (
                <div className="summary-item-line" style={{ color: "var(--ink-faint)" }}>
                  <span className="item-name">GST</span>
                  <span>{fmt(split.gstCents)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildShareText(splits: PersonSplit[], restaurantName: string | null): string {
  const date = new Date().toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
  const header = restaurantName ? `🍜 ${restaurantName} · ${date}` : `🍜 Bill Split · ${date}`;
  const lines = splits.map((s) => `${s.name}: ${fmt(s.totalCents)}`);
  const total = splits.reduce((sum, s) => sum + s.totalCents, 0);
  return [header, "", ...lines, "", `Total: ${fmt(total)}`, "", "via SplitPot"].join("\n");
}

export default function SummaryPage() {
  const router = useRouter();
  const splits = useSplitStore((s) => s.splits);
  const participants = useSplitStore((s) => s.participants);
  const restaurantName = useSplitStore((s) => s.restaurantName);
  const reset = useSplitStore((s) => s.reset);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (splits.length === 0) router.replace("/");
  }, [splits, router]);

  const me = participants.find((p) => p.me);
  const shareText = buildShareText(splits, restaurantName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  };

  const total = splits.reduce((s, r) => s + r.totalCents, 0);

  return (
    <div className="app scanlines" style={{ position: "relative" }}>
      <TopBar step={6} onBack={() => router.push("/extras")} billName={restaurantName} />

      <div className="summary-scroll">
        <div style={{ padding: "12px 6px 8px" }}>
          <div style={{
            fontFamily: "var(--font-pixel), 'Press Start 2P', monospace",
            fontSize: 9, color: "var(--ink-dim)", letterSpacing: "0.1em", marginBottom: 4,
          }}>▸ FINAL SPLIT</div>
          <div style={{
            fontFamily: "var(--font-pixel), 'Press Start 2P', monospace",
            fontSize: 14, color: "var(--mint)", textShadow: "0 0 8px rgba(63,255,200,0.4)",
          }}>{fmt(total)}</div>
          <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 2 }}>
            {splits.length} people · tap a card for breakdown
          </div>
        </div>

        {splits.map((s) => (
          <SummaryCard key={s.participantId} split={s} isMe={me?.id === s.participantId} />
        ))}

        <div className="share-banner">
          READY TO SHARE?<br />
          Copy text below and paste in your group chat
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--surface-2)",
          borderRadius: "var(--radius)", padding: 14, marginBottom: 10,
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 12, color: "var(--ink-dim)", lineHeight: 1.8,
          whiteSpace: "pre-wrap",
        }}>
          {shareText}
        </div>
      </div>

      <div className="bottom-bar">
        <div className="cta-row">
          <button
            className="cta"
            style={{ background: copied ? "var(--mint)" : "var(--pink)" }}
            onClick={handleShare}
          >
            {copied ? "✓ COPIED!" : "▸ SHARE SPLIT"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            onClick={() => { reset(); router.push("/"); }}
            style={{ fontSize: 10, color: "var(--ink-faint)", cursor: "pointer", padding: "6px 16px" }}
          >
            NEW SPLIT ↺
          </div>
        </div>
      </div>
    </div>
  );
}
