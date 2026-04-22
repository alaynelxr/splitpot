"use client";

import type { PersonHue } from "@/types";

const HUE_VAR: Record<PersonHue, string> = {
  mint:   "var(--mint)",
  pink:   "var(--pink)",
  gold:   "var(--gold)",
  violet: "var(--violet)",
};

interface Props {
  name: string;
  hue: PersonHue;
  size?: number;
}

export function AvatarDot({ name, hue, size = 24 }: Props) {
  const bg = HUE_VAR[hue] ?? "var(--ink-dim)";
  const letter = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 3,
        background: bg, color: "#0a0420",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-pixel), 'Press Start 2P', monospace",
        fontSize: Math.max(7, Math.floor(size * 0.45)),
        flexShrink: 0,
        fontWeight: 400,
      }}
    >
      {letter}
    </div>
  );
}
