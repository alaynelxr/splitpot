import { createWorker } from "tesseract.js";
import type { LineItem } from "@/types";
import { parseDollarString } from "./calculations";

export interface OcrProgress {
  status: string;
  progress: number; // 0–1
}

export interface OcrResult {
  restaurantName: string | null;
  receiptDate: string | null;
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

/**
 * Checked against the raw line (before name extraction) — patterns where the
 * full original string is needed for reliable detection (dates, timestamps, addresses).
 */
const LINE_SKIP_PATTERNS: RegExp[] = [
  /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/,   // DD/MM/YYYY, MM/DD/YYYY, etc.
  /\b\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}\b/,       // YYYY-MM-DD
  /\b\d{1,2}:\d{2}(?::\d{2})?\b/,                  // HH:MM or HH:MM:SS timestamps
  /#\s*\d{2,3}-\d{2,4}\b/,                         // unit numbers e.g. #01-23
  /\b(blk|block|jln|jalan|street|st|road|rd|avenue|ave|drive|dr|lane|ln|crescent)\b/i,
  /\btel\.?\s*(no\.?)?\s*[:\d+]/i,                 // phone lines
  /\bgst\s*(reg|registration)?\s*no\b/i,           // GST reg number
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
  /\b(tel|fax|hp|phone|hotline|website|www|uen|co\.?\s*reg)\b/i,
  /\btotal\b/i,
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
/**
 * Phases Tesseract goes through, in order.
 * We map them to a global 0–1 progress by weighting each phase.
 */
const PHASE_WEIGHTS: Record<string, { start: number; span: number }> = {
  "loading tesseract core":       { start: 0.00, span: 0.20 },
  "loading language traineddata": { start: 0.20, span: 0.30 },
  "initializing tesseract":       { start: 0.50, span: 0.10 },
  "initializing api":             { start: 0.60, span: 0.10 },
  "recognizing text":             { start: 0.70, span: 0.30 },
};

function toGlobalProgress(status: string, phaseProgress: number): number {
  const phase = PHASE_WEIGHTS[status];
  if (!phase) return 0;
  return phase.start + phase.span * phaseProgress;
}

export async function runOcr(
  imageFile: File,
  onProgress: (p: OcrProgress) => void,
  signal?: AbortSignal
): Promise<OcrResult> {
  console.log("[OCR] runOcr called, file:", imageFile.name, imageFile.size, "bytes");

  const WORKER_TIMEOUT_MS = 45_000;

  console.log("[OCR] Creating Tesseract worker (workerPath=/tesseract-worker.min.js)");

  let worker;
  try {
    worker = await Promise.race([
      createWorker("eng", 1, {
        workerPath: "/tesseract-worker.min.js",
        workerBlobURL: false,
        // Serve WASM core and language data from local public/ — no CDN needed.
        corePath: "/tesseract-core",
        langPath: "/lang-data",
        logger: (m: { status: string; progress: number }) => {
          console.log(`[OCR] logger: status="${m.status}" progress=${m.progress?.toFixed(3)}`);
          if (signal?.aborted) return;
          const global = toGlobalProgress(m.status, m.progress ?? 0);
          onProgress({ status: m.status, progress: global });
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`[OCR] createWorker timed out after ${WORKER_TIMEOUT_MS}ms`)),
          WORKER_TIMEOUT_MS
        )
      ),
    ]);
    console.log("[OCR] Worker created successfully");
  } catch (err) {
    console.error("[OCR] Worker creation FAILED:", err);
    throw err;
  }

  try {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    console.log("[OCR] Calling worker.recognize...");
    const { data } = await worker.recognize(imageFile);
    console.log("[OCR] recognize() completed, raw text length:", data.text.length);

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    return parseReceiptText(data.text);
  } finally {
    console.log("[OCR] Terminating worker");
    await worker.terminate();
  }
}

function matchPrice(line: string): { matchStr: string; cents: number } | null {
  // 1. Explicit decimal: $12.99 / 12.99 / 12,99
  const dec = line.match(/\$?\s*(\d{1,4}[.,]\d{2})\s*$/);
  if (dec) {
    const cents = parseDollarString(dec[1].replace(",", "."));
    if (cents !== null && cents > 0) return { matchStr: dec[0], cents };
  }

  // 2. 3–4 digit integer → treat as implicit 2-decimal price (OCR dropped the period)
  //    e.g. "2099" → $20.99,  "770" → $7.70
  const longInt = line.match(/\b(\d{3,4})\s*$/);
  if (longInt) {
    const cents = parseInt(longInt[1], 10);
    if (cents > 0) return { matchStr: longInt[0], cents };
  }

  // 3. 1–2 digit integer → whole dollar amount, but only when a preceding number
  //    exists on the line (indicating a quantity, e.g. "Prawn Paste 1 10")
  const shortInt = line.match(/\b(\d{1,2})\s*$/);
  if (shortInt) {
    const before = line.slice(0, line.lastIndexOf(shortInt[0]));
    if (/\d/.test(before)) {
      const cents = parseInt(shortInt[1], 10) * 100;
      if (cents > 0) return { matchStr: shortInt[0], cents };
    }
  }

  return null;
}

/**
 * Parse raw OCR text into structured receipt data.
 * Exported for unit-testing without needing Tesseract.
 */
export function parseReceiptText(rawText: string): OcrResult {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim().replace(/[-*~|\\©®™°•·]+$/, "").trim())
    .filter(Boolean);

  console.log("[OCR] parseReceiptText: total non-empty lines:", lines.length);
  console.log("[OCR] Full raw text:\n" + rawText);

  const receiptDate = extractReceiptDateTime(lines);
  console.log("[OCR] receiptDate:", receiptDate);

  let restaurantName: string | null = null;
  let serviceChargePct: number | null = null;
  let serviceChargeCentsRaw: number | null = null;
  let gstPct: number | null = null;
  let gstCentsRaw: number | null = null;
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
    // Match price at end of line. Try patterns in order of reliability:
    //   1. Explicit decimal:    "12.99" or "12,99"
    //   2. 3-4 digit integer:   "2099" → $20.99, "770" → $7.70 (period dropped by OCR)
    //   3. 1-2 digit integer:   "10" → $10.00, "3" → $3.00 (only when a qty number precedes it)
    const priceResult = matchPrice(line);
    if (!priceResult) {
      console.log(`[OCR] SKIP (no price match): "${line}"`);
      continue;
    }

    const { matchStr, cents: priceCents } = priceResult;
    if (priceCents <= 0) {
      console.log(`[OCR] SKIP (zero price): "${line}"`);
      continue;
    }

    // Skip date/address lines before name extraction (check raw line with original punctuation)
    if (LINE_SKIP_PATTERNS.some((re) => re.test(line))) {
      console.log(`[OCR] SKIP (date/address): "${line}"`);
      continue;
    }

    // Extract item name: everything before the price
    const namePart = line.slice(0, line.lastIndexOf(matchStr)).trim();
    const cleanName = namePart.replace(/[^\w\s'&\-()]/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanName) {
      console.log(`[OCR] SKIP (empty name after clean): "${line}"`);
      continue;
    }

    // Skip summary rows
    if (SKIP_KEYWORDS.some((re) => re.test(cleanName))) {
      console.log(`[OCR] SKIP (keyword match): "${line}"`);
      continue;
    }

    // Detect service charge
    if (SERVICE_KEYWORDS.some((re) => re.test(cleanName))) {
      const pct = extractPercent(line);
      if (pct !== null && pct > 0 && pct <= 30) {
        serviceChargePct = pct;
        console.log(`[OCR] SERVICE CHARGE (explicit %): "${line}" → ${pct}%`);
      } else {
        serviceChargeCentsRaw = priceCents;
        console.log(`[OCR] SERVICE CHARGE (raw amount): "${line}" → ${priceCents}¢`);
      }
      continue;
    }

    // Detect GST
    if (GST_KEYWORDS.some((re) => re.test(cleanName))) {
      const pct = extractPercent(line);
      if (pct !== null && pct > 0 && pct <= 20) {
        gstPct = pct;
        console.log(`[OCR] GST (explicit %): "${line}" → ${pct}%`);
      } else {
        gstCentsRaw = priceCents;
        console.log(`[OCR] GST (raw amount): "${line}" → ${priceCents}¢`);
      }
      continue;
    }

    console.log(`[OCR] LINE ITEM: name="${cleanName}" price=${priceCents}¢ (from "${line}")`);
    lineItems.push({
      id: genId(),
      name: cleanName || "Item",
      priceCents,
      assignedTo: [],
    });
  }

  // Back-calculate percentages from raw charge amounts when no explicit % was on the receipt.
  // Service charge base = items subtotal; GST base = subtotal + service charge.
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.priceCents, 0);
  if (serviceChargePct === null && serviceChargeCentsRaw !== null && subtotalCents > 0) {
    serviceChargePct = Math.round((serviceChargeCentsRaw / subtotalCents) * 1000) / 10;
    console.log(`[OCR] SERVICE CHARGE back-calculated: ${serviceChargeCentsRaw}¢ / ${subtotalCents}¢ → ${serviceChargePct}%`);
  }
  if (gstPct === null && gstCentsRaw !== null) {
    const svcCents = serviceChargePct !== null ? Math.round(subtotalCents * serviceChargePct / 100) : (serviceChargeCentsRaw ?? 0);
    const gstBase = subtotalCents + svcCents;
    if (gstBase > 0) {
      gstPct = Math.round((gstCentsRaw / gstBase) * 1000) / 10;
      console.log(`[OCR] GST back-calculated: ${gstCentsRaw}¢ / ${gstBase}¢ → ${gstPct}%`);
    }
  }

  console.log(`[OCR] Parse result: ${lineItems.length} items, restaurant="${restaurantName}", date="${receiptDate}", svc=${serviceChargePct}%, gst=${gstPct}%`);
  return {
    restaurantName,
    receiptDate,
    lineItems,
    serviceChargePct,
    gstPct,
    rawText,
  };
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function extractReceiptDateTime(lines: string[]): string | null {
  const dateRe = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;
  const timeRe = /\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?\b/i;

  for (const line of lines) {
    const dateMatch = line.match(dateRe);
    if (!dateMatch) continue;

    let d = parseInt(dateMatch[1], 10);
    let m = parseInt(dateMatch[2], 10) - 1; // 0-indexed
    let y = parseInt(dateMatch[3], 10);
    if (y < 100) y += 2000;

    // If parsing as DD/MM gives month > 11, it's MM/DD — swap
    if (m > 11) { [d, m] = [m + 1, d - 1]; }
    if (m < 0 || m > 11 || d < 1 || d > 31) continue;

    const timeMatch = line.match(timeRe);
    let timeStr = "";
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const min = timeMatch[2];
      const ampm = timeMatch[3]?.toLowerCase();
      if (ampm) {
        timeStr = `, ${h}.${min}${ampm}`;
      } else {
        const isPm = h >= 12;
        const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
        timeStr = `, ${displayH}.${min}${isPm ? "pm" : "am"}`;
      }
    }

    return `${d} ${MONTHS_SHORT[m]} ${y}${timeStr}`;
  }
  return null;
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
