import { useState } from "react";
import { db } from "../../lib/db";
import { formatCurrency, formatDate } from "../../lib/utils";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = db.useQuery({
    payments: {
      $: { order: { paymentDate: "desc" } },
      student: {},
      feeType: {},
    },
  });

  const payments = data?.payments ?? [];

  const filtered = search.trim()
    ? payments.filter(
        (p) =>
          p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
          (p.student as { fullName?: string })?.fullName
            ?.toLowerCase()
            .includes(search.toLowerCase())
      )
    : payments;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
        <p className="text-sm text-slate-500">
          {payments.length} payment record{payments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Payment ID or student name…"
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            {search ? "No payments match your search." : "No payments recorded yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Payment ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Student ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Student Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fee Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Term</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fee Amount</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Fees Paid</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Method</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((payment) => {
                  const student = payment.student as { fullName?: string; studentId?: string } | undefined;
                  const currency = (payment.currency as "GHS" | "USD") ?? "GHS";
                  return (
                    <tr
                      key={payment.id}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,61,145,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {payment.transactionId}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {student?.studentId ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {student?.fullName ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 whitespace-nowrap">
                        {payment.feeName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {payment.term} Term
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-700">
                        {formatCurrency(payment.feeAmount ?? 0, currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold">
                        {formatCurrency(payment.amountPaid ?? 0, currency)}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${(payment.balance ?? 0) > 0 ? "text-rose-600" : "text-slate-400"}`}>
                        {formatCurrency(payment.balance ?? 0, currency)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: "rgba(11,61,145,0.06)", color: "var(--color-primary)" }}
                        >
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
