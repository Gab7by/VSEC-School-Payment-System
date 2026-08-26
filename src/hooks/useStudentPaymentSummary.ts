import { db } from "../lib/db";
import { getCurrency } from "../lib/constants";
import { feeMatchesStudent } from "../lib/feeMatching";

export function useStudentPaymentSummary(studentId: string) {
  const { data, isLoading, error } = db.useQuery({
    students: {
      $: { where: { id: studentId } },
      payments: { feeType: {} },
    },
    feeTypes: { assignedStudent: {}, excludedStudents: {} },
  });

  if (isLoading || error || !data) {
    return { isLoading, error, summary: null, payments: [], feeTypes: [] };
  }

  const student = data.students?.[0];
  const feeTypes = data.feeTypes ?? [];

  if (!student) {
    return { isLoading: false, error: null, summary: null, payments: [], feeTypes };
  }

  const payments = student.payments ?? [];
  const currency = getCurrency(student.nationalityGroup);

  let totalDue = 0;
  for (const ft of feeTypes) {
    if (!feeMatchesStudent(ft, student)) continue;
    totalDue += ft.amount ?? 0;
  }

  const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid ?? 0), 0);
  const balance = Math.max(0, totalDue - totalPaid);

  return {
    isLoading: false,
    error: null,
    summary: { totalDue, totalPaid, balance },
    payments,
    feeTypes,
    student,
    currency,
  };
}
