"use client";

import type { Participant } from "@/types";
import { AvatarDot } from "./AvatarDot";

const fmt = (cents: number) => `S$${(cents / 100).toFixed(2)}`;

interface Props {
  people: Participant[];
  totals: Record<string, number>;
}

export function PeopleRow({ people, totals }: Props) {
  return (
    <div className="people-row">
      {people.map((p) => (
        <div key={p.id} className="person-chip">
          <AvatarDot name={p.name} hue={p.hue} size={24} />
          <div className="name">{p.name}</div>
          <div className="subtotal">{fmt(totals[p.id] ?? 0)}</div>
        </div>
      ))}
    </div>
  );
}
