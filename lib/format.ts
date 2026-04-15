import type { PersonSplit, BillExtras, LineItem } from "@/types";
import { formatCents, itemsTotal } from "./calculations";

interface FormatOptions {
  restaurantName: string | null;
  date: string;
  splits: PersonSplit[];
  lineItems: LineItem[];
  extras: BillExtras;
  participantCount: number;
}

/** Generate the Telegram-ready copy-paste summary text */
export function formatSummaryText(opts: FormatOptions): string {
  const { restaurantName, date, splits, lineItems, extras, participantCount } = opts;

  const dateStr = new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const header = restaurantName
    ? `🍲 SplitPot — ${restaurantName} — ${dateStr}`
    : `🍲 SplitPot — ${dateStr}`;

  // Shared-by-all items
  const sharedItems = lineItems.filter(
    (i) => i.assignedTo.length === 0 || i.assignedTo.length === participantCount
  );
  const sharedTotal = sharedItems.reduce((s, i) => s + i.priceCents, 0);
  const sharedPerPax =
    participantCount > 0 ? Math.floor(sharedTotal / participantCount) : 0;

  let sharedBlock = "";
  if (sharedItems.length > 0) {
    sharedBlock =
      `\nShared by all (${participantCount} pax): ${formatCents(sharedTotal)} → ${formatCents(sharedPerPax)}/pax\n` +
      sharedItems.map((i) => `  ${i.name}`).join("\n");
  }

  // Sub-group items (assigned to a subset, more than 1 person)
  const subgroupItems = lineItems.filter(
    (i) =>
      i.assignedTo.length > 1 &&
      i.assignedTo.length < participantCount
  );

  // Group by assignedTo set
  const subgroupMap = new Map<string, LineItem[]>();
  for (const item of subgroupItems) {
    const key = [...item.assignedTo].sort().join(",");
    if (!subgroupMap.has(key)) subgroupMap.set(key, []);
    subgroupMap.get(key)!.push(item);
  }

  let subgroupBlock = "";
  for (const [, items] of subgroupMap) {
    const names = items[0].assignedTo; // use first item's assignedTo for label
    const subTotal = items.reduce((s, i) => s + i.priceCents, 0);
    const subPax = Math.floor(subTotal / names.length);
    subgroupBlock +=
      `\n(${names.length} pax): ${formatCents(subTotal)} → ${formatCents(subPax)}/pax\n` +
      items.map((i) => `  ${i.name}`).join("\n") + "\n";
  }

  // Individual items
  const individualItems = lineItems.filter((i) => i.assignedTo.length === 1);
  let individualBlock = "";
  if (individualItems.length > 0) {
    individualBlock =
      "\nIndividual items:\n" +
      individualItems
        .map((i) => {
          const split = splits.find((s) => s.participantId === i.assignedTo[0]);
          const name = split?.name ?? i.assignedTo[0];
          return `  👤 ${name}: ${i.name} — ${formatCents(i.priceCents)}`;
        })
        .join("\n");
  }

  // Per-person totals
  const perPersonBlock =
    "\n───────────────\n💰 Per person:\n" +
    splits.map((s) => `  ${s.name}: ${formatCents(s.totalCents)}`).join("\n");

  // Grand total
  const grandTotal = splits.reduce((s, r) => s + r.totalCents, 0);
  const taxParts: string[] = [];
  if (extras.serviceChargePct > 0) taxParts.push(`${extras.serviceChargePct}% svc`);
  if (extras.gstPct > 0) taxParts.push(`${extras.gstPct}% GST`);
  const taxSuffix =
    taxParts.length > 0 ? ` (incl. ${taxParts.join(" + ")})` : "";

  const totalLine = `\nTotal: ${formatCents(grandTotal)}${taxSuffix}`;

  return [header, sharedBlock, subgroupBlock, individualBlock, perPersonBlock, totalLine]
    .filter(Boolean)
    .join("\n");
}
