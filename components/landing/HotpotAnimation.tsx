"use client";

export function HotpotAnimation() {
  return (
    <div className="relative flex flex-col items-center select-none" aria-hidden>
      {/* Steam wisps */}
      <div className="flex gap-5 mb-2 h-8 items-end">
        <div className="steam-1 w-2 h-6 bg-orange/30 rounded-full" />
        <div className="steam-2 w-2 h-8 bg-orange/25 rounded-full" />
        <div className="steam-3 w-2 h-5 bg-orange/30 rounded-full" />
      </div>

      {/* Pot body — CSS pixel art */}
      <div className="relative">
        {/* Lid */}
        <div className="mx-auto w-24 h-3 bg-muted/70 border border-border" />
        {/* Handle on lid */}
        <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-6 h-2 bg-muted/70 border border-border" />

        {/* Bowl */}
        <div
          className="w-32 h-20 bg-surface border border-dashed border-orange relative overflow-hidden mt-0.5"
          style={{ clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)" }}
        >
          {/* Broth */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-orange/20" />
          {/* Bubbles */}
          <Bubble x={20} delay={0} />
          <Bubble x={55} delay={0.7} />
          <Bubble x={88} delay={1.3} />
          <Bubble x={38} delay={0.4} />
          {/* Divider line */}
          <div className="absolute bottom-14 left-0 right-0 h-px bg-orange/40" />
        </div>

        {/* Handles */}
        <div className="absolute top-6 -left-5 w-5 h-8 border border-dashed border-orange bg-surface" />
        <div className="absolute top-6 -right-5 w-5 h-8 border border-dashed border-orange bg-surface" />
      </div>

      {/* Stand */}
      <div className="flex gap-4 mt-1">
        <div className="w-3 h-6 bg-border" />
        <div className="w-3 h-6 bg-border" />
        <div className="w-3 h-6 bg-border" />
      </div>
    </div>
  );
}

function Bubble({ x, delay }: { x: number; delay: number }) {
  return (
    <div
      className="absolute bottom-0 w-2 h-2 bg-orange/60 rounded-full"
      style={{
        left: x,
        animation: `steam 1.4s ease-out ${delay}s infinite`,
      }}
    />
  );
}
