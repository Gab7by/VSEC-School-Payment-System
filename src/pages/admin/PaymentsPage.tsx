import { useState } from "react";
import { db } from "../../lib/db";
import { formatCurrency, formatDate } from "../../lib/utils";

type DeleteTarget =
  | { mode: "all"; count: number }
  | {
      mode: "payment";
      paymentId: string;
      studentName: string;
      studentInstantId: string;
      studentPaymentCount: number;
    };

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  function openRowDelete(payment: (typeof payments)[number]) {
    const studentObj = payment.student as { id?: string; fullName?: string } | undefined;
    const studentInstantId = studentObj?.id ?? "";
    const studentPaymentCount = payments.filter(
      (p) => (p.student as { id?: string })?.id === studentInstantId
    ).length;
    setDeleteError("");
    setDeleteTarget({
      mode: "payment",
      paymentId: payment.id,
      studentName: studentObj?.fullName ?? "this student",
      studentInstantId,
      studentPaymentCount,
    });
  }

  async function confirmDelete(deleteStudentAll = false) {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      let idsToDelete: string[];
      if (deleteTarget.mode === "all") {
        idsToDelete = payments.map((p) => p.id);
      } else if (deleteStudentAll) {
        idsToDelete = payments
          .filter(
            (p) =>
              (p.student as { id?: string })?.id === deleteTarget.studentInstantId
          )
          .map((p) => p.id);
      } else {
        idsToDelete = [deleteTarget.paymentId];
      }
      await db.transact(idsToDelete.map((pid) => db.tx.payments[pid].delete()));
      setDeleteTarget(null);
    } catch {
      setDeleteError("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
          <p className="text-sm text-slate-500">
            {payments.length} payment record{payments.length !== 1 ? "s" : ""}
          </p>
        </div>
        {payments.length > 0 && (
          <button
            onClick={() => {
              setDeleteError("");
              setDeleteTarget({ mode: "all", count: payments.length });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 border border-rose-300 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <TrashIcon />
            Delete All
          </button>
        )}
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
                  <th className="px-4 py-3.5"></th>
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
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.06)")}
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
                          style={{ background: "rgba(212,175,55,0.1)", color: "var(--color-primary-dark)" }}
                        >
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {payment.paymentDate ? formatDate(payment.paymentDate) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => openRowDelete(payment)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete payment"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 backdrop-blur-sm"
            style={{ background: "rgba(15,23,42,0.6)" }}
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4 animate-scale-in">
            {/* Icon + title */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {deleteTarget.mode === "all" ? "Delete All Payments" : "Delete Payment"}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            {/* Detail box */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 space-y-1">
              {deleteTarget.mode === "all" ? (
                <p>
                  This will permanently delete{" "}
                  <strong>all {deleteTarget.count} payment record{deleteTarget.count !== 1 ? "s" : ""}</strong>{" "}
                  from the database.
                </p>
              ) : (
                <p>
                  Choose what to delete for{" "}
                  <strong>{deleteTarget.studentName}</strong>:
                </p>
              )}
            </div>

            {deleteError && (
              <p className="text-sm text-rose-600">{deleteError}</p>
            )}

            {/* Buttons */}
            {deleteTarget.mode === "all" ? (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => !deleting && setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete()}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl transition-colors"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting…
                    </span>
                  ) : "Delete All"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => confirmDelete(false)}
                  disabled={deleting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl transition-colors"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting…
                    </span>
                  ) : "Delete this payment only"}
                </button>
                {deleteTarget.studentPaymentCount > 1 && (
                  <button
                    onClick={() => confirmDelete(true)}
                    disabled={deleting}
                    className="w-full px-4 py-2.5 text-sm font-medium text-rose-700 border border-rose-300 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 rounded-xl transition-colors"
                  >
                    Delete all {deleteTarget.studentPaymentCount} payments for {deleteTarget.studentName}
                  </button>
                )}
                <button
                  onClick={() => !deleting && setDeleteTarget(null)}
                  disabled={deleting}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
