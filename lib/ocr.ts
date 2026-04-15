import { createWorker } from "tesseract.js";
import type { LineItem } from "@/types";
import { parseDollarString } from "./calculations";

export interface OcrProgress {
  status: string;
  progress: number; // 0–1
}

export interface OcrResult {
  restaurantName: string | null;
  lineItems: LineItem[];
  serviceChargePct: number | null;
  gstPct: number | null;
  rawText: string;
}

/**
 * Keywords that signal a service charge or GST line — these should be
 * moved to BillExtras rather than shown as assignable items.
 */
const SERVICE_KEYWORDS = [
  /service\s*charge/i,
  /svc\s*chg/i,
  /serv\s*chg/i,
  /s\.?c\.?/i,
];

const GST_KEYWORDS = [
  /\bgst\b/i,
  /goods\s*&?\s*services\s*tax/i,
  /tax/i,
];

const SKIP_KEYWORDS = [
  /subtotal/i,
  /sub\s*total/i,
  /total\s*before/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /grand\s*total/i,
  /rounding/i,
  /change/i,
  /cash/i,
  /payment/i,
  /receipt/i,
  /thank\s*you/i,
  /bill\s*no/i,
  /table/i,
  /cover/i,
  /pax/i,
];

let idCounter = 0;
function genId(): string {
  return `ocr-${Date.now()}-${++idCounter}`;
}

/**
 * Extract a percentage value from a string like "10%", "10.00%", "10 %"
 */
function extractPercent(s: string): number | null {
  const match = s.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Run OCR on an image file and return structured receipt data.
 * @param imageFile  Compressed image file
 * @param onProgress Called with progress updates 0–1
 * @param signal     AbortSignal for cancellation
 */
export async function runOcr(
  imageFile: File,
  onProgress: (p: OcrProgress) => void,
  signal?: AbortSignal
): Promise<OcrResult> {
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (signal?.aborted) return;
      onProgress({ status: m.status, progress: m.progress ?? 0 });
    },
  });

  try {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const { data } = await worker.recognize(imageFile);

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    return parseReceiptText(data.text);
  } finally {
    await worker.terminate();
  }
}

/**
 * Parse raw OCR text into structured receipt data.
 * Exported for unit-testing without needing Tesseract.
 */
export function parseReceiptText(rawText: string): OcrResult {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let restaurantName: string | null = null;
  let serviceChargePct: number | null = null;
  let gstPct: number | null = null;
  const lineItems: LineItem[] = [];

  // Attempt to extract restaurant name from the first 1–3 non-empty lines
  // that look like a header (no price, mostly letters, length > 4)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    const hasCurrency = /\$|\d+\.\d{2}/.test(line);
    const looksLikeHeader =
      !hasCurrency && line.length > 4 && /[a-zA-Z]{3,}/.test(line);
    if (looksLikeHeader && !restaurantName) {
      restaurantName = titleCase(line.replace(/[^a-zA-Z0-9 '&\-]/g, " ").trim());
      if (restaurantName.length < 3) restaurantName = null;
    }
  }

  // Parse line items
  for (const line of lines) {
    // Try to find a price at the end of the line
    // Patterns: $12.50  12.50  12,50
    const priceMatch = line.match(/\$?\s*(\d{1,4}[.,]\d{2})\s*$/);
    if (!priceMatch) continue;

    const priceStr = priceMatch[1].replace(",", ".");
    const priceCents = parseDollarString(priceStr);
    if (priceCents === null || priceCents <= 0) continue;

    // Extract item name: everything before the price
    const namePart = line.slice(0, line.lastIndexOf(priceMatch[0])).trim();
    const cleanName = namePart.replace(/[^\w\s'&\-()]/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanName) continue;

    // Skip summary rows
    if (SKIP_KEYWORDS.some((re) => re.test(cleanName))) continue;

    // Detect service charge
    if (SERVICE_KEYWORDS.some((re) => re.test(cleanName))) {
      const pct = extractPercent(line) ?? (priceCents / 100);
      if (pct !== null && pct > 0 && pct <= 30) {
        serviceChargePct = pct;
      }
      continue;
    }

    // Detect GST
    if (GST_KEYWORDS.some((re) => re.test(cleanName))) {
      const pct = extractPercent(line);
      if (pct !== null && pct > 0 && pct <= 20) {
        gstPct = pct;
      }
      continue;
    }

    lineItems.push({
      id: genId(),
      name: cleanName || "Item",
      priceCents,
      assignedTo: [],
    });
  }

  return {
    restaurantName,
    lineItems,
    serviceChargePct,
    gstPct,
    rawText,
  };
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
