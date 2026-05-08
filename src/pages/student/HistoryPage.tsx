import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/db";
import { formatCurrency, formatDate } from "../../lib/utils";
import { getCurrency } from "../../lib/constants";
import ReceiptPrint, { triggerPrint, type ReceiptData } from "../../components/admin/ReceiptPrint";

export default function HistoryPage() {
  const { session } = useAuth();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const { data, isLoading } = db.useQuery({
    students: {
      $: { where: { id: session?.id ?? "" } },
      payments: {
        feeType: {},
        $: { order: { paymentDate: "desc" } },
      },
    },
  });

  const student = data?.students?.[0];
  const payments = student?.payments ?? [];
  const currency = getCurrency(student?.nationalityGroup ?? session?.nationalityGroup);

  function handleDownload(payment: typeof payments[number]) {
    const ft = payment.feeType as { amount?: number } | undefined;
    const receipt: ReceiptData = {
      transactionId: payment.transactionId ?? "",
      studentName: student?.fullName ?? session?.name ?? "",
      studentId: student?.studentId ?? session?.studentId ?? "",
      schoolType: student?.schoolType ?? session?.schoolType ?? "",
      classLevel: student?.classLevel ?? session?.classLevel ?? "",
      feeName: payment.feeName ?? "",
      term: payment.term ?? "",
      feeAmount: payment.feeAmount ?? ft?.amount ?? 0,
      amountPaid: payment.amountPaid ?? 0,
      balance: payment.balance ?? 0,
      paymentMethod: payment.paymentMethod ?? "",
      paymentDate: payment.paymentDate ?? Date.now(),
      currency: (payment.currency as "GHS" | "USD") ?? currency,
    };
    setSelectedReceipt(receipt);
    // Small delay to allow the receipt component to render before printing
    setTimeout(() => triggerPrint(() => setSelectedReceipt(null)), 100);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        <p className="text-sm text-gray-500">
          {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400 text-sm">
          No payments recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-100 rounded-xl px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{p.feeName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.term} Term</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-0.5 rounded">
                      {p.transactionId}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.paymentDate ? formatDate(p.paymentDate) : ""}
                    </span>
                    <span className="text-xs text-gray-500">{p.paymentMethod}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-green-700">
                    {formatCurrency(p.amountPaid ?? 0, (p.currency as "GHS" | "USD") ?? currency)}
                  </p>
                  {(p.balance ?? 0) > 0 && (
                    <p className="text-xs text-red-500 mt-0.5">
                      Bal: {formatCurrency(p.balance ?? 0, (p.currency as "GHS" | "USD") ?? currency)}
                    </p>
                  )}
                  <button
                    onClick={() => handleDownload(p)}
                    className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Receipt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden receipt for printing */}
      <ReceiptPrint data={selectedReceipt} />
    </div>
  );
}
