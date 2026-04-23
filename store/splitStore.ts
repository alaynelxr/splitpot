"use client";

import { create } from "zustand";
import type { Participant, LineItem, BillExtras, PersonSplit, SplitSession } from "@/types";
import { HUES, HUE_COLORS } from "@/types";
import { calculateSplits } from "@/lib/calculations";

interface SplitStore extends SplitSession {
  setRestaurantName: (name: string | null) => void;
  setReceiptDate: (date: string | null) => void;
  setRawImage: (dataUrl: string | null) => void;
  addParticipant: (name: string, isMe?: boolean) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, name: string) => void;
  reorderParticipants: (ids: string[]) => void;
  setParticipants: (participants: Participant[]) => void;
  setLineItems: (items: LineItem[]) => void;
  addLineItem: (item: Omit<LineItem, "id">) => void;
  updateLineItem: (id: string, patch: Partial<Omit<LineItem, "id">>) => void;
  removeLineItem: (id: string) => void;
  assignItem: (itemId: string, participantIds: string[]) => void;
  setExtras: (extras: Partial<BillExtras>) => void;
  computeSplits: () => void;
  reset: () => void;
}

const defaultExtras: BillExtras = {
  serviceChargePct: 0,
  gstPct: 0,
  discountValue: 0,
  discountType: "flat",
  discountTiming: "before_tax",
};

const defaultSession: SplitSession = {
  restaurantName: null,
  receiptDate: null,
  date: new Date().toISOString(),
  rawImage: null,
  participants: [],
  lineItems: [],
  extras: defaultExtras,
  splits: [],
};

let idCounter = 0;
function genId(): string {
  return `${Date.now()}-${++idCounter}`;
}

export const useSplitStore = create<SplitStore>((set, get) => ({
  ...defaultSession,

  setRestaurantName: (name) => set({ restaurantName: name }),
  setReceiptDate: (date) => set({ receiptDate: date }),
  setRawImage: (dataUrl) => set({ rawImage: dataUrl }),

  addParticipant: (name, isMe = false) => {
    const { participants } = get();
    if (participants.length >= 15) return;
    const idx = participants.length;
    const hue = HUES[idx % HUES.length];
    const color = HUE_COLORS[hue];
    const p: Participant = { id: genId(), name: name.trim(), color, hue, me: isMe };
    set({ participants: [...participants, p] });
  },

  removeParticipant: (id) => {
    const { participants, lineItems } = get();
    const updated = participants.filter((p) => p.id !== id);
    const updatedItems = lineItems.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.filter((pid) => pid !== id),
    }));
    set({ participants: updated, lineItems: updatedItems });
  },

  updateParticipant: (id, name) => {
    const { participants } = get();
    set({ participants: participants.map((p) => p.id === id ? { ...p, name } : p) });
  },

  reorderParticipants: (ids) => {
    const { participants } = get();
    const map = new Map(participants.map((p) => [p.id, p]));
    set({ participants: ids.map((id) => map.get(id)!).filter(Boolean) });
  },

  setParticipants: (participants) => set({ participants }),

  setLineItems: (items) => set({ lineItems: items }),

  addLineItem: (item) => {
    const { lineItems } = get();
    set({ lineItems: [...lineItems, { ...item, id: genId() }] });
  },

  updateLineItem: (id, patch) => {
    const { lineItems } = get();
    set({ lineItems: lineItems.map((item) => item.id === id ? { ...item, ...patch } : item) });
  },

  removeLineItem: (id) => {
    const { lineItems } = get();
    set({ lineItems: lineItems.filter((item) => item.id !== id) });
  },

  assignItem: (itemId, participantIds) => {
    const { lineItems, participants } = get();
    const allIds = participants.map((p) => p.id);
    const isAll =
      participantIds.length === allIds.length &&
      allIds.every((id) => participantIds.includes(id));
    set({
      lineItems: lineItems.map((item) =>
        item.id === itemId ? { ...item, assignedTo: isAll ? [] : participantIds } : item
      ),
    });
  },

  setExtras: (extras) => {
    set((state) => ({ extras: { ...state.extras, ...extras } }));
  },

  computeSplits: () => {
    const { participants, lineItems, extras } = get();
    const splits = calculateSplits(participants, lineItems, extras);
    set({ splits, date: new Date().toISOString() });
  },

  reset: () => set({ ...defaultSession, date: new Date().toISOString() }),
}));
