export const SCHOOL_TYPES = [
  "VSEC College of Studies",
  "Donkor Kids Talent International School",
] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];

export const VSEC_SCHOOL: SchoolType = "VSEC College of Studies";

export const VSEC_CAMPUSES = [
  "Osu Campus",
  "Kumasi Campus",
  "Other Campuses",
] as const;
export type VsecCampus = (typeof VSEC_CAMPUSES)[number];

export const VSEC_STUDY_MODES = [
  "Regular",
  "Weekend",
  "Online",
  "1-on-1 Campus & Online",
  "1-on-1 Home Tuition",
] as const;
export type VsecStudyMode = (typeof VSEC_STUDY_MODES)[number];

export const CLASS_LEVELS: Record<SchoolType, readonly string[]> = {
  "VSEC College of Studies": [
    "Beginners (A1&A2)",
    "Transition Level (Upper A2)",
    "Intermediate Level (B1&B2)",
    "Advanced Level (C1&C2)",
    "Professional Level",
    "Standardized Test (IELTS/TOEFL)",
    "Adult Senior High School",
    "Computer Training",
  ],
  "Donkor Kids Talent International School": [
    "Pre-School",
    "Grade 1-3",
    "Grade 4",
    "Grade 5 & 6",
  ],
};

export const TERMS = ["Term 1", "Term 2", "Term 3"] as const;
export type Term = (typeof TERMS)[number];

export const PAYMENT_METHODS = ["Mobile Money", "Bank Transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ALL_CLASSES_LABEL = "All Classes";
export const ALL_CAMPUSES_LABEL = "All Campuses";
export const ALL_STUDY_MODES_LABEL = "All Study Modes";

export const VSEC_NATIONALITY_GROUPS = ["Ghanaian", "International"] as const;
export type VsecNationalityGroup = (typeof VSEC_NATIONALITY_GROUPS)[number];

export function getCurrency(nationalityGroup?: string): "GHS" | "USD" {
  return nationalityGroup === "International" ? "USD" : "GHS";
}
