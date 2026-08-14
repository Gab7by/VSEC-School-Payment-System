import { db } from "../lib/db";
import { VSEC_SCHOOL } from "../lib/constants";
import { feeMatchesStudent } from "../lib/feeMatching";

export type DashboardFilter =
  | "All"
  | "VSEC — Ghanaian"
  | "VSEC — International"
  | "Donkor Kids Talent International School";

export function useAdminDashboardStats(filter: DashboardFilter) {
  const { data, isLoading, error } = db.useQuery({
    students: { payments: {} },
    feeTypes: {},
  });

  if (isLoading || error || !data) {
    return { isLoading, error, stats: null };
  }

  const { students, feeTypes } = data;

  // Determine filtered students based on filter
  let filteredStudents = students;
  if (filter === "VSEC — Ghanaian") {
    filteredStudents = students.filter(
      (s) => s.schoolType === VSEC_SCHOOL && s.nationalityGroup === "Ghanaian"
    );
  } else if (filter === "VSEC — International") {
    filteredStudents = students.filter(
      (s) => s.schoolType === VSEC_SCHOOL && s.nationalityGroup === "International"
    );
  } else if (filter === "Donkor Kids Talent International School") {
    filteredStudents = students.filter(
      (s) => s.schoolType === "Donkor Kids Talent International School"
    );
  }

  // All currency is GHS now
  const currency: "GHS" | "USD" = "GHS";

  // Collect all payments for filtered students
  let totalPaid = 0;
  const filteredPaymentIds: string[] = [];
  for (const student of filteredStudents) {
    for (const payment of student.payments ?? []) {
      filteredPaymentIds.push(payment.id);
      totalPaid += payment.amountPaid ?? 0;
    }
  }

  // Total revenue = sum of fee type amounts × number of matching students per fee type
  let totalRevenue = 0;
  for (const ft of feeTypes) {
    // Skip fees that don't match the filter scope
    if (filter === "VSEC — Ghanaian") {
      if (ft.schoolType !== VSEC_SCHOOL || ft.nationalityGroup !== "Ghanaian") continue;
    } else if (filter === "VSEC — International") {
      if (ft.schoolType !== VSEC_SCHOOL || ft.nationalityGroup !== "International") continue;
    } else if (filter === "Donkor Kids Talent International School") {
      if (ft.schoolType !== "Donkor Kids Talent International School") continue;
    }

    const matchingStudents = filteredStudents.filter((s) => feeMatchesStudent(ft, s));
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
      filteredPaymentIds,
      currency,
    },
  };
}
