// GSM 03.38 basic character set. Any character outside this set forces the
// message into Unicode encoding (shorter per-segment limit). Extended GSM-7
// characters (e.g. `{`, `}`, `€`) technically cost 2 chars each under strict
// GSM-7 rules; we approximate by treating any non-basic character as forcing
// Unicode mode entirely, which slightly overestimates segments in rare mixed
// cases but never underestimates cost to the admin.
const GSM_7BIT_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_7BIT_SET = new Set(GSM_7BIT_BASIC);

function isGsm7(message: string): boolean {
  for (const ch of message) {
    if (!GSM_7BIT_SET.has(ch)) return false;
  }
  return true;
}

export type SmsUnitInfo = {
  length: number;
  encoding: "GSM-7" | "Unicode";
  charsPerSegment: number;
  segments: number;
  unitsUsed: number;
};

export function calculateSmsUnits(message: string): SmsUnitInfo {
  const length = message.length;
  const encoding: "GSM-7" | "Unicode" = isGsm7(message) ? "GSM-7" : "Unicode";
  const singleSegmentSize = encoding === "GSM-7" ? 160 : 70;
  const concatSegmentSize = encoding === "GSM-7" ? 153 : 67;
  const segments =
    length === 0 ? 0 : length <= singleSegmentSize ? 1 : Math.ceil(length / concatSegmentSize);

  return {
    length,
    encoding,
    charsPerSegment: segments <= 1 ? singleSegmentSize : concatSegmentSize,
    segments,
    unitsUsed: segments,
  };
}

// Normalizes a Ghanaian phone number to Arkesel's expected "233XXXXXXXXX"
// format (12 digits, no "+"). Accepts local (0XXXXXXXXX), international
// (233XXXXXXXXX / +233XXXXXXXXX), and bare 9-digit subscriber numbers.
// Returns null for anything that doesn't resolve to a valid 9-digit
// subscriber number, deliberately staying permissive on carrier-prefix
// specifics (those lists change) and just enforcing shape/length.
export function normalizeGhanaPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let national: string | null = null;
  if (digits.length === 10 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("233")) {
    national = digits.slice(3);
  } else if (digits.length === 9) {
    national = digits;
  }

  if (!national || national.length !== 9) return null;
  const normalized = `233${national}`;
  return /^233\d{9}$/.test(normalized) ? normalized : null;
}

// Splits a free-typed blob of phone numbers (comma, space, and/or
// newline-separated) into normalized, deduplicated valid numbers and the
// raw tokens that couldn't be recognized, so the UI can flag exactly what
// needs fixing.
export function parsePhoneListBlob(blob: string): { valid: string[]; invalid: string[] } {
  const tokens = blob
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const validSet = new Set<string>();
  const invalid: string[] = [];

  for (const token of tokens) {
    const normalized = normalizeGhanaPhone(token);
    if (normalized) {
      validSet.add(normalized);
    } else {
      invalid.push(token);
    }
  }

  return { valid: Array.from(validSet), invalid };
}
