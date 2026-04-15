"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { runOcr } from "@/lib/ocr";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function ProcessingPage() {
  const router = useRouter();
  const rawImage = useSplitStore((s) => s.rawImage);
  const setLineItems = useSplitStore((s) => s.setLineItems);
  const setRestaurantName = useSplitStore((s) => s.setRestaurantName);
  const setExtras = useSplitStore((s) => s.setExtras);

  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("LOADING OCR ENGINE...");
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard: if no image, send back to landing
    if (!rawImage) {
      router.replace("/");
      return;
    }
    // Prevent double-run in React StrictMode dev
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    async function run() {
      try {
        // Convert data URL back to a File for Tesseract
        const res = await fetch(rawImage!);
        const blob = await res.blob();
        const file = new File([blob], "receipt.jpg", { type: blob.type });

        const result = await runOcr(
          file,
          (p) => {
            setProgress(p.progress);
            setStatusLabel(
              p.status === "recognizing text"
                ? "READING BILL..."
                : p.status.toUpperCase().replace(/_/g, " ")
            );
          },
          controller.signal
        );

        if (controller.signal.aborted) return;

        if (result.lineItems.length === 0) {
          router.replace("/ocr-error");
          return;
        }

        // Commit results to store
        setLineItems(result.lineItems);
        setRestaurantName(result.restaurantName);
        setExtras({
          serviceChargePct: result.serviceChargePct ?? 0,
          gstPct: result.gstPct ?? 0,
        });

        router.replace("/group");
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
        console.error("OCR failed:", err);
        router.replace("/ocr-error");
      }
    }

    run();

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    abortRef.current?.abort();
    router.replace("/");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 bg-bg gap-10">
      {/* Crab mascot placeholder */}
      <div className="text-center" aria-hidden>
        <div className="text-7xl mb-2" style={{ imageRendering: "pixelated" }}>
          🦀
        </div>
        <p className="font-heading text-xs text-muted tracking-widest">
          NOM NOM RECEIPT...
        </p>
      </div>

      {/* Status + progress */}
      <div className="w-full max-w-[280px] flex flex-col items-center gap-4">
        <p className="font-heading text-sm text-orange tracking-wider text-center">
          {statusLabel}
        </p>
        <ProgressBar progress={progress} className="w-full" />
      </div>

      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="font-heading text-xs text-muted hover:text-pink transition-colors mt-4"
      >
        CANCEL
      </button>
    </main>
  );
}
