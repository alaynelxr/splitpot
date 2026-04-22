"use client";

import { useRouter } from "next/navigation";
import { useSplitStore } from "@/store/splitStore";
import { TopBar } from "@/components/TopBar";
import { Crab } from "@/components/PixelArt";

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
    setLineItems([]);
    router.push("/group");
  };

  return (
    <div className="app scanlines">
      <TopBar step={1} onBack={() => router.replace("/")} />
      <div className="error-screen">
        <div className="error-body">
          <div style={{ filter: "drop-shadow(0 0 10px rgba(255,58,163,0.4))" }}>
            <Crab px={4} />
          </div>
          <div className="error-title">COULDN&apos;T<br/>READ BILL</div>
          <div className="error-sub">
            The OCR engine couldn&rsquo;t extract items from this photo. Try again with a clearer shot, or enter items manually.
          </div>

          <div className="tips-card">
            <div className="tips-title">▸ PHOTO TIPS</div>
            {TIPS.map((tip) => (
              <div key={tip} className="tip-row">
                <span>›</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom-bar" style={{ position: "relative", paddingTop: 16 }}>
          <div className="cta-row">
            <button className="cta" onClick={() => router.replace("/")}>
              ▸ TRY AGAIN
            </button>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              onClick={handleManual}
              style={{ fontSize: 11, color: "var(--violet)", cursor: "pointer", padding: "8px 0", letterSpacing: "0.05em" }}
            >
              ENTER MANUALLY →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
