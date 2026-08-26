import { VSEC_SCHOOL } from "./constants";

export type FeeMatchFee = {
  schoolType?: string;
  classLevel?: string;
  allClasses?: boolean;
  campus?: string;
  allCampuses?: boolean;
  studyMode?: string;
  allStudyModes?: boolean;
  nationalityGroup?: string;
  assignedStudent?: { id?: string } | null;
  excludedStudents?: { id?: string }[] | null;
};

export type FeeMatchStudent = {
  id?: string;
  schoolType?: string;
  classLevel?: string;
  campus?: string;
  studyMode?: string;
  nationalityGroup?: string;
};

// A fee assigned to a specific student matches only that student, bypassing
// every other criterion. A general fee that has excluded a specific student
// (e.g. because they got a personalized replacement) never matches them.
// Otherwise, VSEC fees must match Campus + Study Mode + Class Level +
// Nationality together; other schools match on Class Level only.
export function feeMatchesStudent(fee: FeeMatchFee, student: FeeMatchStudent): boolean {
  if (fee.assignedStudent?.id) return fee.assignedStudent.id === student.id;
  if (fee.excludedStudents?.some((s) => s.id === student.id)) return false;
  if (fee.schoolType !== student.schoolType) return false;
  if (!fee.allClasses && fee.classLevel !== student.classLevel) return false;
  if (student.schoolType === VSEC_SCHOOL) {
    if (!fee.allCampuses && fee.campus !== student.campus) return false;
    if (!fee.allStudyModes && fee.studyMode !== student.studyMode) return false;
    if (fee.nationalityGroup !== student.nationalityGroup) return false;
  }
  return true;
}
