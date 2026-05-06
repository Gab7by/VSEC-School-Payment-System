import { db } from "../lib/db";
import type { SchoolType } from "../lib/constants";

export function useAdminDashboardStats(filterSchoolType: SchoolType | "All") {
  const { data, isLoading, error } = db.useQuery({
    students: { payments: {} },
    feeTypes: {},
  });

  if (isLoading || error || !data) {
    return { isLoading, error, stats: null };
  }

  const { students, feeTypes } = data;

  const filteredStudents =
    filterSchoolType === "All"
      ? students
      : students.filter((s) => s.schoolType === filterSchoolType);

  const filteredIds = new Set(filteredStudents.map((s) => s.id));

  // Collect all payments for filtered students
  let totalPaid = 0;
  for (const student of filteredStudents) {
    for (const payment of student.payments ?? []) {
      totalPaid += payment.amountPaid ?? 0;
    }
  }

  // Total revenue = sum of fee type amounts × number of matching students per fee type
  let totalRevenue = 0;
  for (const ft of feeTypes) {
    if (filterSchoolType !== "All" && ft.schoolType !== filterSchoolType) continue;
    const matchingStudents = filteredStudents.filter(
      (s) =>
        s.schoolType === ft.schoolType &&
        (ft.allClasses || s.classLevel === ft.classLevel)
    );
    totalRevenue += (ft.amount ?? 0) * matchingStudents.length;
  }

  const outstanding = Math.max(0, totalRevenue - totalPaid);

  return {
    isLoading: false,
    error: null,
    stats: {
      totalStudents: filteredStudents.length,
      totalStudentsAll: students.length,
      totalRevenue,
      totalPaid,
      outstanding,
      filteredIds,
    },
  };
}
