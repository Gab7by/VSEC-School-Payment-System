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
};

export default function RecentPaymentsList({ payments, onViewAll }: Props) {
  const recent = payments.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Recent Payments</h3>
        {payments.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            View All
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
          No payments yet.
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.feeName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.term} Term · {p.paymentDate ? formatDate(p.paymentDate) : ""}
                </p>
              </div>
              <p className="text-sm font-bold text-green-700 shrink-0">
                {formatCurrency(p.amountPaid ?? 0)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
