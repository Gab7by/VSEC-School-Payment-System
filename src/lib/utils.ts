export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const VSEC_LANGUAGE_LEVELS = new Set([
  "Beginners (A1&A2)",
  "Transition Level (Upper A2)",
  "Intermediate Level (B1&B2)",
  "Advanced Level (C1&C2)",
  "Professional Level",
]);

function getVsecCourseCode(nationalityGroup: string | undefined, classLevel: string): string {
  if (classLevel === "Standardized Test (IELTS/TOEFL)") return "03";
  if (classLevel === "Computer Training") return "05";
  if (classLevel === "Adult Senior High School") return "04";
  if (VSEC_LANGUAGE_LEVELS.has(classLevel))
    return nationalityGroup === "International" ? "02" : "01";
  return "01";
}

export function generateStudentId(
  schoolType: string,
  nationalityGroup: string | undefined,
  classLevel: string,
  existingStudents: Array<{ studentId?: string; schoolType?: string }>
): string {
  const year = String(new Date().getFullYear());
  if (schoolType === "VSEC College of Studies") {
    const prefix = year + getVsecCourseCode(nationalityGroup, classLevel);
    const nums = existingStudents
      .filter((s) => s.studentId?.startsWith(prefix) && s.studentId.length === 10)
      .map((s) => parseInt(s.studentId!.slice(6), 10))
      .filter((n) => !isNaN(n));
    return prefix + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0");
  } else {
    const nums = existingStudents
      .filter((s) => s.schoolType === schoolType && s.studentId?.startsWith(year) && s.studentId.length === 8)
      .map((s) => parseInt(s.studentId!.slice(4), 10))
      .filter((n) => !isNaN(n));
    return year + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0");
  }
}

// Excludes visually ambiguous characters: 0/O, 1/l/I
export function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export function generateTransactionId(): string {
  const timestamp = Date.now();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
  return `TXN-${timestamp}-${suffix}`;
}

export function formatCurrency(amount: number, currency: "GHS" | "USD" = "GHS"): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `GHS ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-GH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
