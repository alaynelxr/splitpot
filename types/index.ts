export const PLAYER_COLORS = [
  "#FF6B35",
  "#00E676",
  "#FF4081",
  "#00BCD4",
  "#FFD600",
  "#CE93D8",
  "#80DEEA",
  "#FF8A65",
  "#C6FF00",
  "#9D9DB5",
] as const;

export interface Participant {
  id: string;
  name: string;
  color: string; // hex from PLAYER_COLORS
}

/** A single line item parsed from the receipt (or entered manually). */
export interface LineItem {
  id: string;
  name: string;
  /** Stored as integer cents to avoid floating-point drift */
  priceCents: number;
  /** IDs of participants who share this item. Empty array = all participants. */
  assignedTo: string[];
  /** OCR confidence 0–1. Items below 0.7 are flagged. */
  confidence?: number;
}

export type DiscountType = "flat" | "percent";
export type DiscountTiming = "before_tax" | "after_tax";
export type RoundingUnit = "none" | "005" | "010";

export interface BillExtras {
  serviceChargePct: number;   // e.g. 10 for 10%
  gstPct: number;             // e.g. 9 for 9%
  discountValue: number;      // amount or percentage
  discountType: DiscountType;
  discountTiming: DiscountTiming;
}

/** Per-person calculation result */
export interface PersonSplit {
  participantId: string;
  name: string;
  color: string;
  /** Subtotal of item portions, in cents */
  itemSubtotalCents: number;
  /** Share of service charge, in cents */
  serviceChargeCents: number;
  /** Share of GST, in cents */
  gstCents: number;
  /** Share of discount (negative = reduction), in cents */
  discountCents: number;
  /** Final total in cents */
  totalCents: number;
  /** Items attributed (for breakdown display) */
  sharedItems: Array<{ name: string; shareCents: number }>;
  individualItems: Array<{ name: string; priceCents: number }>;
}

export interface SplitSession {
  restaurantName: string | null;
  date: string; // ISO date string
  rawImage: string | null; // base64 or object URL
  participants: Participant[];
  lineItems: LineItem[];
  extras: BillExtras;
  splits: PersonSplit[];
}
