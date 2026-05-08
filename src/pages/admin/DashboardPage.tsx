import { useState } from "react";
import { db } from "../../lib/db";
import { useAdminDashboardStats, type DashboardFilter } from "../../hooks/useAdminDashboardStats";
import StatCard from "../../components/ui/Card";
import { formatCurrency } from "../../lib/utils";

const FILTER_OPTIONS: { label: string; value: DashboardFilter }[] = [
  { label: "All School Types", value: "All" },
  { label: "VSEC — Ghanaian", value: "VSEC — Ghanaian" },
  { label: "VSEC — International", value: "VSEC — International" },
  { label: "Donkor Kids", value: "Donkor Kids Talent International School" },
];

export default function DashboardPage() {
  const [filter, setFilter] = useState<DashboardFilter>("All");
  const { isLoading, stats } = useAdminDashboardStats(filter);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!stats || stats.filteredPaymentIds.length === 0) return;
    setResetting(true);
    try {
      await db.transact(
        stats.filteredPaymentIds.map((pid) => db.tx.payments[pid].delete())
      );
      setShowResetModal(false);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-500">Overview of school payment statistics</p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          {/* Pill filter tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition-all"
                style={
                  filter === value
                    ? { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "white" }
                    : { background: "white", borderColor: "#cbd5e1", color: "#475569" }
                }
                onMouseEnter={(e) => {
                  if (filter !== value) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== value) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
                    (e.currentTarget as HTMLButtonElement).style.color = "#475569";
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Reset button */}
          {stats && stats.totalPaid > 0 && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 border border-rose-300 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Fees Paid
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Students"
            value={String(stats.totalStudents)}
            sub={filter !== "All" ? `of ${stats.totalStudentsAll} total` : undefined}
            color="blue"
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue, stats.currency)}
            sub="Expected fees"
            color="gray"
          />
          <StatCard
            label="Total Fees Paid"
            value={formatCurrency(stats.totalPaid, stats.currency)}
            color="green"
          />
          <StatCard
            label="Outstanding Fees"
            value={formatCurrency(stats.outstanding, stats.currency)}
            color="red"
          />
        </div>
      ) : null}

      {/* Filter info banner */}
      <div
        className="rounded-xl px-4 py-3 border text-sm"
        style={{ background: "rgba(11,61,145,0.04)", borderColor: "rgba(11,61,145,0.15)" }}
      >
        {filter === "All" ? (
          <p style={{ color: "rgba(11,61,145,0.75)" }}>
            International student fees (USD) are excluded from these totals — select{" "}
            <strong>VSEC — International</strong> to view USD statistics.
          </p>
        ) : (
          <p style={{ color: "rgba(11,61,145,0.75)" }}>
            Showing statistics for <strong>{filter}</strong> students only.
            {filter === "VSEC — International" && (
              <span className="ml-1">Amounts in <strong>USD ($)</strong>.</span>
            )}
          </p>
        )}
      </div>

      {/* Reset Fees Confirmation Modal */}
      {showResetModal && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 backdrop-blur-sm"
            style={{ background: "rgba(15,23,42,0.6)" }}
            onClick={() => !resetting && setShowResetModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Reset Fees Paid</h3>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="text-rose-800">
                This will permanently delete{" "}
                <strong>{stats.filteredPaymentIds.length} payment record{stats.filteredPaymentIds.length !== 1 ? "s" : ""}</strong>{" "}
                and reset the total fees paid to{" "}
                <strong>{stats.currency === "USD" ? "$0.00" : "GHS 0.00"}</strong>.
              </p>
              <p className="text-rose-700">
                <span className="font-medium">Scope:</span>{" "}
                {filter === "All" ? "All school types" : filter}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl transition-colors"
              >
                {resetting ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting…
                  </span>
                ) : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
