import ExcelJS from "exceljs";
import type { PaymentWithLinks } from "./types";
import { formatDate } from "./utils";

export async function downloadPaymentsExcel(
  payments: PaymentWithLinks[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Payments");

  sheet.columns = [
    { header: "Payment ID", key: "paymentId", width: 22 },
    { header: "Student ID", key: "studentId", width: 14 },
    { header: "Student Name", key: "studentName", width: 24 },
    { header: "School", key: "school", width: 24 },
    { header: "Class", key: "classLevel", width: 16 },
    { header: "Fee Name", key: "feeName", width: 20 },
    { header: "Term", key: "term", width: 12 },
    { header: "Fee Amount", key: "feeAmount", width: 14 },
    { header: "Fees Paid", key: "amountPaid", width: 14 },
    { header: "Balance", key: "balance", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Payment Date", key: "paymentDate", width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const payment of payments) {
    const student = payment.student as
      | {
          studentId?: string;
          fullName?: string;
          schoolType?: string;
          classLevel?: string;
        }
      | undefined;

    sheet.addRow({
      paymentId: payment.transactionId,
      studentId: student?.studentId ?? "",
      studentName: student?.fullName ?? "",
      school: student?.schoolType ?? "",
      classLevel: student?.classLevel ?? "",
      feeName: payment.feeName,
      term: payment.term,
      feeAmount: payment.feeAmount ?? 0,
      amountPaid: payment.amountPaid ?? 0,
      balance: payment.balance ?? 0,
      currency: payment.currency ?? "GHS",
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vsec-payments-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
