import jsPDF from "jspdf";
import type { ReceiptData } from "../components/admin/ReceiptPrint";
import { formatCurrency, formatDateTime } from "./utils";

export function downloadReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
  const W = 148;
  const margin = 15;
  const rightX = W - margin;
  const centerX = W / 2;
  const currency = data.currency ?? "GHS";

  let y = 18;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VSEC SCHOOL", centerX, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Official Payment Receipt", centerX, y, { align: "center" });
  y += 6;

  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 30, 30);
  doc.line(margin, y, rightX, y);
  y += 8;

  // Helper: label on left, value on right
  const addRow = (label: string, value: string, boldValue = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin, y);
    doc.setFont("helvetica", boldValue ? "bold" : "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(value, rightX, y, { align: "right" });
    y += 6;
  };

  const dashedRule = () => {
    y += 2;
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.3);
    doc.setDrawColor(160, 160, 160);
    doc.line(margin, y, rightX, y);
    doc.setLineDashPattern([], 0);
    y += 7;
  };

  // Transaction info
  addRow("Receipt No.", data.transactionId);
  addRow("Date & Time", formatDateTime(data.paymentDate));

  dashedRule();

  // Student info
  addRow("Student Name", data.studentName);
  addRow("Student ID", data.studentId);
  addRow("School", data.schoolType);
  addRow("Class / Level", data.classLevel);

  dashedRule();

  // Fee info
  addRow("Fee Name", data.feeName);
  addRow("Term", `${data.term} Term`);
  addRow("Total Fee", formatCurrency(data.feeAmount, currency));
  addRow("Amount Paid", formatCurrency(data.amountPaid, currency), true);
  addRow("Balance Due", formatCurrency(data.balance, currency));
  addRow("Payment Method", data.paymentMethod);

  // Footer rule
  y += 3;
  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 30, 30);
  doc.line(margin, y, rightX, y);
  y += 9;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("Thank you for your payment!", centerX, y, { align: "center" });
  y += 5;
  doc.text("Keep this receipt for your records.", centerX, y, { align: "center" });

  doc.save(`vsec-receipt-${data.transactionId}.pdf`);
}
