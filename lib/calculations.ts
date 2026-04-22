import type {
  Participant,
  LineItem,
  BillExtras,
  PersonSplit,
} from "@/types";

/**
 * Core split calculation.
 * All arithmetic is in integer cents to avoid floating-point drift.
 * Remainders from integer division are distributed one cent at a time,
 * starting from the first participant alphabetically (deterministic, no randomness).
 */
export function calculateSplits(
  participants: Participant[],
  lineItems: LineItem[],
  extras: BillExtras
): PersonSplit[] {
  if (participants.length === 0) return [];

  const allIds = participants.map((p) => p.id);

  // Initialise accumulators
  const subtotals = new Map<string, number>(); // id → cents
  for (const p of participants) subtotals.set(p.id, 0);

  // Per-person item breakdown for display
  const sharedItems = new Map<string, Array<{ name: string; shareCents: number }>>();
  const individualItems = new Map<string, Array<{ name: string; priceCents: number }>>();
  for (const p of participants) {
    sharedItems.set(p.id, []);
    individualItems.set(p.id, []);
  }

  // Distribute each line item
  for (const item of lineItems) {
    const recipientIds =
      item.assignedTo.length === 0 ? allIds : item.assignedTo;
    const n = recipientIds.length;

    const baseShare = Math.floor(item.priceCents / n);
    const remainder = item.priceCents - baseShare * n;

    recipientIds.forEach((id, idx) => {
      const share = baseShare + (idx < remainder ? 1 : 0);
      subtotals.set(id, (subtotals.get(id) ?? 0) + share);

      if (n === 1) {
        individualItems.get(id)!.push({ name: item.name, priceCents: item.priceCents });
      } else {
        sharedItems.get(id)!.push({ name: item.name, shareCents: share });
      }
    });
  }

  // Grand item subtotal (needed for proportional tax/discount)
  const grandSubtotalCents = Array.from(subtotals.values()).reduce(
    (a, b) => a + b,
    0
  );

  // Discount applied to the item subtotal
  let discountTotalCents = 0;
  if (extras.discountValue > 0 && extras.discountTiming === "before_tax") {
    discountTotalCents =
      extras.discountType === "flat"
        ? Math.round(extras.discountValue * 100)
        : Math.round(grandSubtotalCents * (extras.discountValue / 100));
  }

  const taxableBase = grandSubtotalCents - discountTotalCents;

  const serviceChargeTotalCents = Math.round(
    taxableBase * (extras.serviceChargePct / 100)
  );
  const gstTotalCents = Math.round(
    (taxableBase + serviceChargeTotalCents) * (extras.gstPct / 100)
  );

  // Discount after tax
  let discountAfterTaxCents = 0;
  if (extras.discountValue > 0 && extras.discountTiming === "after_tax") {
    const grandWithTax =
      grandSubtotalCents + serviceChargeTotalCents + gstTotalCents;
    discountAfterTaxCents =
      extras.discountType === "flat"
        ? Math.round(extras.discountValue * 100)
        : Math.round(grandWithTax * (extras.discountValue / 100));
  }

  // Distribute tax/discount proportionally by each person's item subtotal
  const results: PersonSplit[] = participants.map((p) => {
    const itemSub = subtotals.get(p.id) ?? 0;
    const weight = grandSubtotalCents > 0 ? itemSub / grandSubtotalCents : 1 / participants.length;

    const serviceShare = Math.round(serviceChargeTotalCents * weight);
    const gstShare = Math.round(gstTotalCents * weight);
    const discountShare =
      extras.discountTiming === "before_tax"
        ? Math.round(discountTotalCents * weight)
        : Math.round(discountAfterTaxCents * weight);

    const total = itemSub + serviceShare + gstShare - discountShare;

    return {
      participantId: p.id,
      name: p.name,
      color: p.color,
      hue: p.hue,
      itemSubtotalCents: itemSub,
      serviceChargeCents: serviceShare,
      gstCents: gstShare,
      discountCents: discountShare,
      totalCents: Math.max(0, total),
      sharedItems: sharedItems.get(p.id) ?? [],
      individualItems: individualItems.get(p.id) ?? [],
    };
  });

  // Fix rounding drift: calculated total may differ from grand total by a few cents.
  // Assign any difference to the first participant (organizer absorbs).
  const calculatedGrand = results.reduce((s, r) => s + r.totalCents, 0);
  const grandTotal =
    grandSubtotalCents +
    serviceChargeTotalCents +
    gstTotalCents -
    discountTotalCents -
    discountAfterTaxCents;
  const drift = grandTotal - calculatedGrand;
  if (drift !== 0 && results.length > 0) {
    results[0].totalCents += drift;
  }

  return results;
}

/** Format cents as a dollar string: 1050 → "$10.50" */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const centsStr = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars}.${centsStr}`;
}

/** Parse a dollar string to cents: "$10.50" → 1050. Returns null on failure. */
export function parseDollarString(s: string): number | null {
  const cleaned = s.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Grand total in cents across all items */
export function itemsTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((s, i) => s + i.priceCents, 0);
}
