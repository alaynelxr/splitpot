"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { runOcr } from "@/lib/ocr";
import { TopBar } from "@/components/TopBar";
import { Crab } from "@/components/PixelArt";

export default function ProcessingPage() {
  const router = useRouter();
  const rawImage = useSplitStore((s) => s.rawImage);
  const setLineItems = useSplitStore((s) => s.setLineItems);
  const setRestaurantName = useSplitStore((s) => s.setRestaurantName);
  const setReceiptDate = useSplitStore((s) => s.setReceiptDate);
  const setExtras = useSplitStore((s) => s.setExtras);

  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("LOADING OCR ENGINE...");
  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!rawImage) { router.replace("/"); return; }
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    async function run() {
      console.log("[Processing] run() started");
      try {
        console.log("[Processing] Fetching rawImage data URL, length:", rawImage!.length);
        const res = await fetch(rawImage!);
        const blob = await res.blob();
        const file = new File([blob], "receipt.jpg", { type: blob.type });
        console.log("[Processing] File created:", file.name, file.size, "bytes", file.type);

        const result = await runOcr(
          file,
          (p) => {
            setProgress(p.progress);
            const labels: Record<string, string> = {
              "loading tesseract core":       "LOADING OCR ENGINE...",
              "loading language traineddata": "LOADING LANGUAGE DATA...",
              "initializing tesseract":       "INITIALIZING...",
              "initializing api":             "INITIALIZING...",
              "recognizing text":             "READING BILL...",
            };
            const label = labels[p.status] ?? "PROCESSING...";
            console.log(`[Processing] progress callback: "${p.status}" → "${label}" (${(p.progress * 100).toFixed(1)}%)`);
            setStatusLabel(label);
          },
          controller.signal
        );

        console.log("[Processing] OCR complete, lineItems:", result.lineItems.length, "restaurantName:", result.restaurantName);
        if (controller.signal.aborted) return;
        if (result.lineItems.length === 0) {
          console.warn("[Processing] No line items found, going to ocr-error");
          router.replace("/ocr-error");
          return;
        }

        setLineItems(result.lineItems);
        setRestaurantName(result.restaurantName);
        setReceiptDate(result.receiptDate);
        setExtras({ serviceChargePct: result.serviceChargePct ?? 0, gstPct: result.gstPct ?? 0 });
        router.replace("/group");
      } catch (err) {
        console.error("[Processing] run() caught error:", err);
        if ((err as DOMException)?.name === "AbortError") return;
        setStatusLabel("OCR FAILED — CHECK CONSOLE");
        setTimeout(() => router.replace("/ocr-error"), 1500);
      }
    }

    run();
    return () => { controller.abort(); startedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app scanlines">
      <TopBar step={1} />
      <div className="processing">
        <div className="processing-crab">
          <Crab px={5} />
        </div>
        <div className="processing-label" style={statusLabel.includes("FAILED") ? { color: "var(--pink)" } : undefined}>{statusLabel}</div>
        <div style={{ width: "100%", maxWidth: 260 }}>
          <div className="processing-bar">
            <div className="processing-bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
        <div className="processing-sub">NOM NOM RECEIPT...</div>
        <div className="processing-cancel" onClick={() => { abortRef.current?.abort(); router.replace("/"); }}>
          CANCEL
        </div>
      </div>
    </div>
  );
}
