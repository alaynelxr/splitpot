"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { TopBar } from "@/components/TopBar";
import { StepNav } from "@/components/StepNav";
import { AvatarDot } from "@/components/AvatarDot";
import { Crab } from "@/components/PixelArt";
import { HUES, HUE_COLORS } from "@/types";
import type { Participant, PersonHue } from "@/types";

const MAX = 15;

export default function GroupPage() {
  const router = useRouter();
  const storedParticipants = useSplitStore((s) => s.participants);
  const setParticipants = useSplitStore((s) => s.setParticipants);
  const lineItems = useSplitStore((s) => s.lineItems);
  const updateLineItem = useSplitStore((s) => s.updateLineItem);

  const nextId = useRef(100);

  const [people, setPeople] = useState<Participant[]>(() => {
    if (storedParticipants.length >= 2) return storedParticipants.map((p) => ({ ...p }));
    return [
      { id: "p0", name: "You", hue: "mint" as PersonHue, color: HUE_COLORS.mint, me: true },
      { id: "p1", name: "", hue: "pink" as PersonHue, color: HUE_COLORS.pink },
    ];
  });

  const filledCount = people.filter((p) => p.name.trim()).length;
  const canContinue = filledCount >= 2;
  const atMax = people.length >= MAX;

  const updateName = (id: string, name: string) =>
    setPeople((ps) => ps.map((p) => p.id === id ? { ...p, name } : p));

  const addSlot = () => {
    if (atMax) return;
    const idx = people.length;
    const hue = HUES[idx % HUES.length];
    const id = `p${nextId.current++}`;
    setPeople((ps) => [...ps, { id, name: "", hue, color: HUE_COLORS[hue] }]);
  };

  const removeSlot = (id: string) => {
    if (people.length <= 2) return;
    setPeople((ps) => ps.filter((p) => p.id !== id));
  };

  const proceed = () => {
    if (!canContinue) return;
    const cleaned = people
      .filter((p) => p.name.trim())
      .map((p, i) => ({
        ...p,
        name: p.name.trim(),
        hue: i === 0 ? ("mint" as PersonHue) : HUES[i % HUES.length],
        color: i === 0 ? HUE_COLORS.mint : HUE_COLORS[HUES[i % HUES.length]],
      }));

    const validIds = new Set(cleaned.map((p) => p.id));
    lineItems.forEach((item) => {
      if (item.assignedTo.length > 0) {
        const filtered = item.assignedTo.filter((id) => validIds.has(id));
        if (filtered.length !== item.assignedTo.length) {
          updateLineItem(item.id, { assignedTo: filtered });
        }
      }
    });

    setParticipants(cleaned);
    router.push("/items");
  };

  return (
    <div className="app scanlines">
      <TopBar step={2} onBack={() => router.push("/")} />
      <StepNav step={2} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 110 }}>
        <div className="setup-hero">
          <div className="eyebrow">◂ STEP 02 / 06 ▸</div>
          <div className="setup-crab">
            <Crab px={3} />
          </div>
          <div className="title">
            Who&rsquo;s <span className="accent">splitting?</span>
          </div>
          <div className="sub">Add each person&rsquo;s name.</div>
        </div>

        <div className="setup-meta">
          <div className="label">▸ PLAYERS</div>
          <div className={`count ${people.length >= 12 ? "warn" : ""}`}>
            {filledCount}/{people.length}
          </div>
        </div>

        <div className="player-list">
          {people.map((p, i) => {
            const filled = !!p.name.trim();
            const cls = p.me ? "me" : filled ? "filled" : "empty";
            return (
              <div key={p.id} className={`player-slot ${cls}`}>
                <div className="pidx">P{String(i + 1).padStart(2, "0")}</div>
                <AvatarDot name={p.name || "?"} hue={p.hue} size={28} />
                <input
                  className="name-input"
                  value={p.name}
                  onChange={(e) => updateName(p.id, e.target.value)}
                  placeholder={p.me ? "You" : "Tap to name"}
                  maxLength={20}
                />
                {p.me ? (
                  <div className="me-tag">YOU</div>
                ) : (
                  <div className="remove" onClick={() => removeSlot(p.id)} title="Remove">×</div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`add-player ${atMax ? "disabled" : ""}`} onClick={addSlot}>
          + ADD PLAYER{atMax ? " · MAX" : ""}
        </div>
      </div>

      <div className="bottom-bar">
        <div className="cta-row">
          <button className="cta" onClick={proceed} disabled={!canContinue}>
            ▸ {canContinue ? `SCAN BILL · ${filledCount} PLAYERS` : "ADD ≥ 2 NAMES"}
          </button>
        </div>
      </div>
    </div>
  );
}
