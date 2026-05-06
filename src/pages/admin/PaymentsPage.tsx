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
        <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
        <p className="text-sm text-gray-500">
          {payments.length} payment record{payments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Payment ID or student name…"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {search ? "No payments match your search." : "No payments recorded yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Payment ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Student ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Student Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Fee Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Term</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Fee Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Fees Paid</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Balance</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((payment) => {
                  const student = payment.student as { fullName?: string; studentId?: string } | undefined;
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {payment.transactionId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                        {student?.studentId ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {student?.fullName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {payment.feeName}
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {payment.term} Term
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatCurrency(payment.feeAmount ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-green-700 font-medium">
                        {formatCurrency(payment.amountPaid ?? 0)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${(payment.balance ?? 0) > 0 ? "text-red-600" : "text-gray-500"}`}>
                        {formatCurrency(payment.balance ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
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
