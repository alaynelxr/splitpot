"use client";

import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { Button } from "@/components/ui/Button";

const TIPS = [
  "Lay the bill flat on a dark surface",
  "Ensure the full receipt fits in frame",
  "Good lighting — avoid harsh shadows",
  "Hold the camera steady, close enough to read text",
  "Avoid reflections from thermal paper",
];

export default function OcrErrorPage() {
  const router = useRouter();
  const setLineItems = useSplitStore((s) => s.setLineItems);

  const handleManual = () => {
    // Start with a blank item list; user will add items manually
    setLineItems([]);
    router.push("/group");
  };

  return (
    <main className="flex flex-col min-h-screen bg-bg px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.replace("/")}
          className="font-heading text-muted text-xs hover:text-text transition-colors min-w-[44px] min-h-[44px] flex items-center"
        >
          ◄ BACK
        </button>
      </div>

      {/* Icon + title */}
      <div className="flex flex-col items-center text-center mb-8">
        <span className="text-6xl mb-4" aria-hidden style={{ imageRendering: "pixelated" }}>
          🍲
        </span>
        <h1 className="font-heading font-bold text-pink text-lg mb-2">
          COULDN&apos;T READ BILL
        </h1>
        <p className="font-body text-muted text-sm max-w-[280px]">
          The OCR engine couldn&apos;t extract items from this photo. Try again with a
          clearer shot, or enter items manually.
        </p>
      </div>

      {/* Tips */}
      <div className="border border-dashed border-border bg-surface p-4 mb-8">
        <p className="font-heading text-xs text-muted mb-3 tracking-widest">
          📋 PHOTO TIPS
        </p>
        <ul className="flex flex-col gap-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-orange font-heading text-xs shrink-0 mt-0.5">›</span>
              <span className="font-body text-sm text-text">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 mt-auto">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => router.replace("/")}
        >
          📷 TRY AGAIN
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleManual}
        >
          ✏️ ENTER MANUALLY
        </Button>
      </div>
    </main>
  );
}
