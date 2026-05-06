export const SCHOOL_TYPES = ["Adult School", "Basic School"] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const CLASS_LEVELS: Record<SchoolType, readonly string[]> = {
  "Adult School": [
    "Beginner I",
    "Beginner I (Upper)",
    "Beginner II",
    "Beginner II (Upper)",
    "Beginner III",
    "Beginner III (Upper)",
    "Intermediate",
  ],
  "Basic School": [
    "Primary I",
    "Primary II",
    "Primary III",
    "Primary IV",
    "Primary V",
  ],
};

export const TERMS = ["First", "Second", "Third"] as const;
export type Term = (typeof TERMS)[number];

export const FEE_NAMES = [
  "Registration Fee",
  "Tuition Fee",
  "Exams Fee",
] as const;
export type FeeName = (typeof FEE_NAMES)[number];

export const PAYMENT_METHODS = ["Mobile Money", "Bank Transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ALL_CLASSES_LABEL = "All Classes";
