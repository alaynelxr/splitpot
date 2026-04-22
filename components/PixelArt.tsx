"use client";

import type { CSSProperties } from "react";

interface PixelSpriteProps {
  grid: string;
  palette: Record<string, string>;
  px?: number;
  style?: CSSProperties;
}

function PixelSprite({ grid, palette, px = 3, style }: PixelSpriteProps) {
  const rows = grid.trim().split("\n").map((r) => r.trim());
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const shadows: string[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const color = palette[ch];
      if (!color) continue;
      shadows.push(`${x * px}px ${y * px}px 0 ${color}`);
    }
  });
  return (
    <div style={{ position: "relative", width: w * px, height: h * px, ...style }}>
      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: px, height: px,
          boxShadow: shadows.join(","),
        }}
      />
    </div>
  );
}

const CRAB_GRID = `
..........BB........BB..........
.........BBBB......BBBB.........
..........BB........BB..........
...bbb..................bbb.....
..bbbbb................bbbbb....
.bb...bb..bbbbbbbbbb..bb...bb...
bb.....bbbb........bbbb.....bb..
bb.....bb............bb.....bb..
.bb...bb..WW......WW..bb...bb...
..bbbbb...Wb......bW...bbbbb....
...bbb....WW......WW....bbb.....
..........bbbbbbbbbb............
..........bb..bb..bb............
.........bb...bb...bb...........
`.replace(/ /g, ".");

export function Crab({ px = 3 }: { px?: number }) {
  return (
    <PixelSprite
      grid={CRAB_GRID}
      px={px}
      palette={{ b: "#ff3aa3", B: "#ff3aa3", W: "#f4e9ff" }}
    />
  );
}

const PRAWN_GRID = `
.............ggggg....
............gggggGg...
...........gg.g.ggg...
..........gggggggG....
.........gggggggG.....
........gggggggG......
........GGGGGGg.......
.......GGGGGGG........
......ggg..ggG........
.....ggg..............
....ggg...............
...gg.................
..gg..................
.gg...................
gg....................
`.replace(/ /g, ".");

export function Prawn({ px = 3 }: { px?: number }) {
  return (
    <PixelSprite
      grid={PRAWN_GRID}
      px={px}
      palette={{ g: "#ffd447", G: "#c28f12" }}
    />
  );
}

const MUSHROOM_GRID = `
....mmmmmmmm....
..mmmmmmmmmmmm..
.mmWWmmmmWWmmm..
mmWWWmmmmWWWmm.m
mmmmmmmmmmmmmmmm
mmWWmmmmmWWWmmmm
.mmmmWWmmmmmmm..
..mmmmmmmmmmm...
.....cccccc.....
.....cwwwwc.....
.....cwwwwc.....
.....cccccc.....
`.replace(/ /g, ".");

export function Mushroom({ px = 3 }: { px?: number }) {
  return (
    <PixelSprite
      grid={MUSHROOM_GRID}
      px={px}
      palette={{ m: "#3fffc8", W: "#f4e9ff", c: "#b37bff", w: "#f4e9ff" }}
    />
  );
}

const TOFU_GRID = `
...vvvvvvvv...
..vVVVVVVVVv..
.vVvvvvvvvvVv.
vvvvvvvvvvvvvv
vVvvvvvvvvvvVv
vVvvv.WW.vvvVv
vVvvv.WW.vvvVv
vVvvvvvvvvvvVv
vVvvvvvvvvvvVv
.vVvvvvvvvvVv.
..vVVVVVVVVv..
...vvvvvvvv...
`.replace(/ /g, ".");

export function Tofu({ px = 3 }: { px?: number }) {
  return (
    <PixelSprite
      grid={TOFU_GRID}
      px={px}
      palette={{ v: "#b37bff", V: "#6b3fc7", W: "#f4e9ff" }}
    />
  );
}

const EGG_GRID = `
....wwwwww....
...wwwwwwww...
..wwwggggww...
..wwggGGgww...
.wwwggggwwww..
.wwwwwwwwwww..
..wwwwwwwww...
...wwwwww.....
`.replace(/ /g, ".");

export function Egg({ px = 3 }: { px?: number }) {
  return (
    <PixelSprite
      grid={EGG_GRID}
      px={px}
      palette={{ w: "#f4e9ff", g: "#ffd447", G: "#c28f12" }}
    />
  );
}

const CHILI_GRID = `
..mm........
.mmm........
.mm.........
.pp.........
.ppp........
..ppp.......
...ppp......
....ppp.....
.....ppp....
......ppp...
.......ppP..
........PP..
`.replace(/ /g, ".");

export function Chili({ px = 3 }: { px?: number }) {
  return (
    <PixelSprite
      grid={CHILI_GRID}
      px={px}
      palette={{ m: "#3fffc8", p: "#ff3aa3", P: "#b01a6e" }}
    />
  );
}

const POT_GRID = `
...gggggggggggggggg...
..g..................g.
.g....................g
g......................g
g..bbb..bbb..bbb..bbb.g
g.bbbbb.bbbbb.bbbbb.bbg
g.bbppb.bbmmb.bbvvb.bbg
g..bpb...bmb...bvb...b.
g......................g
GGGGGGGGGGGGGGGGGGGGGGG
.GGGGGGGGGGGGGGGGGGGGG.
..GGGGGGGGGGGGGGGGGGG..
...GGGGGGGGGGGGGGGGG...
....GGGGGGGGGGGGGGG....
`.replace(/ /g, ".");

export function HotPot({ px = 4 }: { px?: number }) {
  return (
    <PixelSprite
      grid={POT_GRID}
      px={px}
      palette={{ g: "#c28f12", G: "#b37bff", b: "#f4e9ff", p: "#ff3aa3", m: "#3fffc8", v: "#b37bff" }}
    />
  );
}
