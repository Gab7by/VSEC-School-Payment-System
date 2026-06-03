import { formatCurrency, formatDate } from "../../lib/utils";

type Payment = {
  id: string;
  feeName?: string;
  term?: string;
  amountPaid?: number;
  paymentDate?: number;
  transactionId?: string;
};

type Props = {
  payments: Payment[];
  onViewAll: () => void;
  currency?: "GHS" | "USD";
};

export default function RecentPaymentsList({ payments, onViewAll, currency = "GHS" }: Props) {
  const recent = payments.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-900">Recent Payments</h3>
        {payments.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold hover:underline transition-colors"
            style={{ color: "var(--color-primary)" }}
          >
            View All
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400 text-sm">
          No payments yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {recent.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-100 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 hover:shadow-sm transition-all"
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.4)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "")}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.feeName}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {p.term} · {p.paymentDate ? formatDate(p.paymentDate) : ""}
                </p>
              </div>
              <p className="text-sm font-bold text-emerald-600 shrink-0">
                {formatCurrency(p.amountPaid ?? 0, currency)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
