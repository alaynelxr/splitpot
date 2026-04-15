"use client";

import { create } from "zustand";
import type {
  Participant,
  LineItem,
  BillExtras,
  PersonSplit,
  SplitSession,
} from "@/types";
import { PLAYER_COLORS } from "@/types";
import { calculateSplits } from "@/lib/calculations";

interface SplitStore extends SplitSession {
  // Setters
  setRestaurantName: (name: string | null) => void;
  setRawImage: (dataUrl: string | null) => void;

  // Participants
  addParticipant: (name: string) => void;
  removeParticipant: (id: string) => void;
  reorderParticipants: (ids: string[]) => void;

  // Line items
  setLineItems: (items: LineItem[]) => void;
  addLineItem: (item: Omit<LineItem, "id">) => void;
  updateLineItem: (id: string, patch: Partial<Omit<LineItem, "id">>) => void;
  removeLineItem: (id: string) => void;

  // Assignment
  assignItem: (itemId: string, participantIds: string[]) => void;

  // Extras
  setExtras: (extras: Partial<BillExtras>) => void;

  // Compute
  computeSplits: () => void;

  // Reset
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
  setRawImage: (dataUrl) => set({ rawImage: dataUrl }),

  addParticipant: (name) => {
    const { participants } = get();
    if (participants.length >= 10) return;
    const color = PLAYER_COLORS[participants.length % PLAYER_COLORS.length];
    const p: Participant = { id: genId(), name: name.trim(), color };
    set({ participants: [...participants, p] });
  },

  removeParticipant: (id) => {
    const { participants, lineItems } = get();
    const updated = participants.filter((p) => p.id !== id);
    // Remove this participant from all item assignments
    const updatedItems = lineItems.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.filter((pid) => pid !== id),
    }));
    set({ participants: updated, lineItems: updatedItems });
  },

  reorderParticipants: (ids) => {
    const { participants } = get();
    const map = new Map(participants.map((p) => [p.id, p]));
    const reordered = ids.map((id) => map.get(id)!).filter(Boolean);
    set({ participants: reordered });
  },

  setLineItems: (items) => set({ lineItems: items }),

  addLineItem: (item) => {
    const { lineItems } = get();
    set({ lineItems: [...lineItems, { ...item, id: genId() }] });
  },

  updateLineItem: (id, patch) => {
    const { lineItems } = get();
    set({
      lineItems: lineItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  },

  removeLineItem: (id) => {
    const { lineItems } = get();
    set({ lineItems: lineItems.filter((item) => item.id !== id) });
  },

  assignItem: (itemId, participantIds) => {
    const { lineItems, participants } = get();
    // Empty array = all participants (default shared)
    const allIds = participants.map((p) => p.id);
    const isAll =
      participantIds.length === allIds.length &&
      allIds.every((id) => participantIds.includes(id));
    set({
      lineItems: lineItems.map((item) =>
        item.id === itemId
          ? { ...item, assignedTo: isAll ? [] : participantIds }
          : item
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
