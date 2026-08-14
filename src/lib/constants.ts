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

export const TERMS_BY_SCHOOL: Record<SchoolType, readonly string[]> = {
  "VSEC College of Studies": ["Term 1", "Term 2", "Term 3", "Term 4"],
  "Donkor Kids Talent International School": ["Term 1", "Term 2", "Term 3"],
};
export type Term = (typeof TERMS_BY_SCHOOL)[SchoolType][number];

export const ALL_CLASSES_LABEL = "All Classes";
export const ALL_CAMPUSES_LABEL = "All Campuses";
export const ALL_STUDY_MODES_LABEL = "All Study Modes";

export const VSEC_NATIONALITY_GROUPS = ["Ghanaian", "International"] as const;
export type VsecNationalityGroup = (typeof VSEC_NATIONALITY_GROUPS)[number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site compatibility
export function getCurrency(_nationalityGroup?: string): "GHS" | "USD" {
  return "GHS";
}
