"use client";

import { useRouter } from "next/navigation";

interface StepHeaderProps {
  title: string;
  step?: number;
  totalSteps?: number;
  showBack?: boolean;
  backHref?: string;
}

export function StepHeader({
  title,
  step,
  totalSteps,
  showBack = true,
  backHref,
}: StepHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header className="flex items-center gap-3 px-4 py-4 border-b border-dashed border-border bg-bg sticky top-0 z-10">
      {showBack && (
        <button
          onClick={handleBack}
          className="font-heading text-muted text-xs hover:text-text transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
          aria-label="Go back"
        >
          ◄ BACK
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading font-bold text-sm text-text truncate">{title}</h1>
        {step !== undefined && totalSteps !== undefined && (
          <p className="font-heading text-[10px] text-muted mt-0.5">
            STEP {step}/{totalSteps}
          </p>
        )}
      </div>
    </header>
  );
}
