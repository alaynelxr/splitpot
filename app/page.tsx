"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { HotpotAnimation } from "@/components/landing/HotpotAnimation";
import { useSplitStore } from "@/store/splitStore";
import { compressForOcr, fileToDataUrl } from "@/lib/compress";

export default function LandingPage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const setRawImage = useSplitStore((s) => s.setRawImage);
  const reset = useSplitStore((s) => s.reset);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    reset();
    try {
      const compressed = await compressForOcr(file);
      const dataUrl = await fileToDataUrl(compressed);
      setRawImage(dataUrl);
      router.push("/processing");
    } catch {
      router.push("/ocr-error");
    }
  };

  return (
    <main className="flex flex-col items-center justify-between min-h-screen px-4 py-10 bg-bg">
      {/* Logo */}
      <div className="text-center mt-8">
        <h1
          className="font-display text-orange leading-relaxed"
          style={{ fontSize: "20px" }}
        >
          SPLITPOT
        </h1>
        <p className="font-heading text-muted text-xs mt-3 tracking-widest">
          BILL SPLITTING FOR SHARED MEALS
        </p>
      </div>

      {/* Hotpot hero */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <HotpotAnimation />
        <p className="font-body text-muted text-sm mt-6 text-center max-w-[240px]">
          Photograph your bill. Assign the extras. Share the split.
        </p>
      </div>

      {/* CTAs */}
      <div className="w-full flex flex-col gap-4 mb-8">
        <button
          onClick={() => cameraRef.current?.click()}
          className="w-full font-display text-bg bg-orange py-4 tracking-wide hover:brightness-110 active:brightness-90 transition-all duration-150 min-h-[60px]"
          style={{ fontSize: "16px" }}
        >
          📷 SCAN BILL
        </button>

        <button
          onClick={() => uploadRef.current?.click()}
          className="w-full font-heading text-muted text-sm py-3 hover:text-text transition-colors duration-150"
        >
          or upload from gallery
        </button>

        {/* Hidden file inputs */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </main>
  );
}
