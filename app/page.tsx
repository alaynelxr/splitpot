"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { compressForOcr, fileToDataUrl } from "@/lib/compress";
import { TopBar } from "@/components/TopBar";
import { Crab } from "@/components/PixelArt";

export default function CapturePage() {
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
    <div className="app scanlines">
      <TopBar step={1} />

      <div className="capture">
        <div className="capture-hero">
          <div className="brand-big">SPLITPOT</div>
          <div className="tag">Snap the bill · let the crab crunch it</div>
          <div style={{ fontSize: 10, color: "var(--ink-faint)", marginTop: 6, letterSpacing: "0.05em" }}>No account needed</div>
        </div>

        <div className="arcade-stage">
          <div className="glow-grid" />

          <div className="receipt">
            <div className="r-title">RECEIPT</div>
            <div className="r-line long" />
            <div className="r-line mid" />
            <div className="r-line long" />
            <div className="r-line short" />
            <div className="r-line mid" />
            <div className="r-line long" />
            <div className="r-line short" />
          </div>

          <div className="munch" />
          <div className="munch" />
          <div className="munch" />
          <div className="munch" />

          <div className="crab-wrap">
            <Crab px={4} />
          </div>

          <div className="ocr-strip">
            <div className="dot-blink" />
            <span style={{ color: "var(--mint)", fontFamily: "var(--font-pixel), 'Press Start 2P', monospace", fontSize: 8, letterSpacing: "0.1em" }}>
              OCR READY
            </span>
            <div className="progress" />
          </div>
        </div>

        <div className="capture-ctas">
          <button className="scan-btn" onClick={() => cameraRef.current?.click()}>
            <svg viewBox="0 0 16 16" style={{ imageRendering: "pixelated" }}>
              <rect x="2" y="5" width="12" height="8" fill="currentColor" />
              <rect x="5" y="3" width="5" height="2" fill="currentColor" />
              <rect x="2" y="5" width="2" height="2" fill="#0a0420" />
              <circle cx="8" cy="9" r="2" fill="#0a0420" />
              <rect x="7" y="8" width="2" height="2" fill="currentColor" />
            </svg>
            SCAN BILL
          </button>
          <button className="upload-btn" onClick={() => uploadRef.current?.click()}>
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ imageRendering: "pixelated" }}>
              <rect x="2" y="8" width="8" height="2" fill="currentColor" />
              <rect x="5" y="2" width="2" height="5" fill="currentColor" />
              <rect x="3" y="4" width="2" height="2" fill="currentColor" />
              <rect x="7" y="4" width="2" height="2" fill="currentColor" />
            </svg>
            UPLOAD FROM GALLERY
          </button>
        </div>

        <div className="capture-footer">
          <div className="capture-badges">
            <div className="cap-badge">SGD <span className="lit">●</span></div>
            <div className="cap-badge">GST AUTO</div>
            <div className="cap-badge">SVC AUTO</div>
            <div className="cap-badge">ROUND: EXACT</div>
          </div>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment"
          style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        <input ref={uploadRef} type="file" accept="image/*"
          style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
    </div>
  );
}
