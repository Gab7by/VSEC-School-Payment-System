import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/db";
import { formatCurrency, formatDate } from "../../lib/utils";
import { getCurrency } from "../../lib/constants";
import type { ReceiptData } from "../../components/admin/ReceiptPrint";
import { downloadReceiptPDF } from "../../lib/receiptPdf";

export default function HistoryPage() {
  const { session } = useAuth();
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
    downloadReceiptPDF(receipt);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
        <p className="text-sm text-slate-500">
          {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-400 text-sm">
          No payments recorded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const paymentCurrency = (p.currency as "GHS" | "USD") ?? currency;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-100 rounded-xl px-4 py-4 hover:shadow-sm transition-all"
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(11,61,145,0.2)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{p.feeName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.term}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.transactionId}
                      </span>
                      <span className="text-xs text-slate-400">
                        {p.paymentDate ? formatDate(p.paymentDate) : ""}
                      </span>
                      <span className="text-xs text-slate-400">{p.paymentMethod}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-emerald-600">
                      {formatCurrency(p.amountPaid ?? 0, paymentCurrency)}
                    </p>
                    {(p.balance ?? 0) > 0 && (
                      <p className="text-xs text-rose-500 font-medium mt-0.5">
                        Bal: {formatCurrency(p.balance ?? 0, paymentCurrency)}
                      </p>
                    )}
                    <button
                      onClick={() => handleDownload(p)}
                      className="mt-2 text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors"
                      style={{ color: "var(--color-primary)", background: "rgba(11,61,145,0.06)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(11,61,145,0.12)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(11,61,145,0.06)")}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
