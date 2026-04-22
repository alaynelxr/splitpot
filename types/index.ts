export type PersonHue = "mint" | "pink" | "gold" | "violet";

export const HUES: PersonHue[] = ["mint", "pink", "gold", "violet"];

export const HUE_COLORS: Record<PersonHue, string> = {
  mint:   "#3fffc8",
  pink:   "#ff3aa3",
  gold:   "#ffd447",
  violet: "#b37bff",
};

export const PLAYER_COLORS = [
  "#3fffc8",
  "#ff3aa3",
  "#ffd447",
  "#b37bff",
  "#3fffc8",
  "#ff3aa3",
  "#ffd447",
  "#b37bff",
  "#3fffc8",
  "#ff3aa3",
] as const;

export interface Participant {
  id: string;
  name: string;
  color: string;
  hue: PersonHue;
  me?: boolean;
}

export interface LineItem {
  id: string;
  name: string;
  priceCents: number;
  assignedTo: string[];
  confidence?: number;
  unclear?: boolean;
}

export type DiscountType = "flat" | "percent";
export type DiscountTiming = "before_tax" | "after_tax";
export type RoundingUnit = "none" | "005" | "010";

export interface BillExtras {
  serviceChargePct: number;
  gstPct: number;
  discountValue: number;
  discountType: DiscountType;
  discountTiming: DiscountTiming;
}

export interface PersonSplit {
  participantId: string;
  name: string;
  color: string;
  hue: PersonHue;
  itemSubtotalCents: number;
  serviceChargeCents: number;
  gstCents: number;
  discountCents: number;
  totalCents: number;
  sharedItems: Array<{ name: string; shareCents: number }>;
  individualItems: Array<{ name: string; priceCents: number }>;
}

export interface SplitSession {
  restaurantName: string | null;
  date: string;
  rawImage: string | null;
  participants: Participant[];
  lineItems: LineItem[];
  extras: BillExtras;
  splits: PersonSplit[];
}
