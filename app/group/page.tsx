"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { StepHeader } from "@/components/ui/StepHeader";
import { Button } from "@/components/ui/Button";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { AnimatePresence, motion } from "framer-motion";

const MAX = 10;
const MIN = 2;

export default function GroupPage() {
  const router = useRouter();
  const participants = useSplitStore((s) => s.participants);
  const addParticipant = useSplitStore((s) => s.addParticipant);
  const removeParticipant = useSplitStore((s) => s.removeParticipant);

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name) return;
    if (participants.length >= MAX) {
      setError(`MAX ${MAX} PLAYERS`);
      return;
    }
    if (participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError("DUPLICATE NAME");
      return;
    }
    setError("");
    addParticipant(name);
    setInputValue("");
  };

  const canContinue = participants.length >= MIN;

  return (
    <main className="flex flex-col min-h-screen bg-bg">
      <StepHeader title="WHO'S SPLITTING?" step={1} totalSteps={4} showBack backHref="/" />

      <div className="flex-1 flex flex-col px-4 py-6 gap-6">
        {/* Participant chips */}
        <div className="min-h-[60px]">
          {participants.length === 0 ? (
            <p className="font-heading text-xs text-muted text-center py-4">
              ADD AT LEAST {MIN} PLAYERS TO CONTINUE
            </p>
          ) : (
            <AnimatePresence>
              <div className="flex flex-wrap gap-3">
                {participants.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 px-3 py-2 border border-dashed bg-surface"
                    style={{ borderColor: p.color }}
                  >
                    <AvatarChip name={p.name} color={p.color} size="sm" />
                    <span className="font-heading text-xs text-text">{p.name}</span>
                    <button
                      onClick={() => removeParticipant(p.id)}
                      className="font-heading text-xs text-muted hover:text-pink transition-colors ml-1 min-w-[20px] min-h-[20px] flex items-center justify-center"
                      aria-label={`Remove ${p.name}`}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>

        {/* Count indicator */}
        <p className="font-heading text-xs text-muted">
          {participants.length}/{MAX} PLAYERS
          {participants.length < MIN && (
            <span className="text-pink ml-2">· NEED {MIN - participants.length} MORE</span>
          )}
        </p>

        {/* Input */}
        {participants.length < MAX && (
          <div>
            <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-dashed border-border">
              <span className="font-heading text-green text-xs shrink-0 select-none">
                &gt; ADD PLAYER:
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                maxLength={20}
                autoFocus
                placeholder="type a name..."
                className="flex-1 bg-transparent text-text font-heading text-sm outline-none placeholder:text-muted/50"
                aria-label="Add player name"
              />
              <button
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                className="font-heading text-xs text-orange hover:brightness-110 disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                + ADD
              </button>
            </div>
            {error && (
              <p className="font-heading text-xs text-pink mt-2">{error}</p>
            )}
          </div>
        )}

        {/* Hint */}
        <p className="font-body text-xs text-muted">
          No accounts needed — just names. You can edit assignments in the next step.
        </p>
      </div>

      {/* Footer CTA */}
      <div className="px-4 pb-8 pt-4 border-t border-dashed border-border">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canContinue}
          onClick={() => router.push("/items")}
        >
          REVIEW ITEMS →
        </Button>
      </div>
    </main>
  );
}
