import { formatCurrency } from "../../lib/utils";

type Props = {
  totalDue: number;
  totalPaid: number;
  balance: number;
  currency?: "GHS" | "USD";
};

export default function SummaryCards({ totalDue, totalPaid, balance, currency = "GHS" }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-6 translate-x-6 opacity-10 bg-white" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Total Fees Due</p>
        <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalDue, currency)}</p>
      </div>

      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #10b981 0%, #065f46 100%)" }}>
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-6 translate-x-6 opacity-10 bg-white" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Amount Paid</p>
        <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalPaid, currency)}</p>
      </div>

      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: balance > 0 ? "linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)" : "linear-gradient(135deg, #64748b 0%, #1e293b 100%)" }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-6 translate-x-6 opacity-10 bg-white" />
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Balance</p>
        <p className="text-2xl font-bold text-white mt-1">{formatCurrency(balance, currency)}</p>
      </div>
    </div>
  );
}
