import { useState } from "react";
import { db } from "../../lib/db";
import { useAdminDashboardStats } from "../../hooks/useAdminDashboardStats";
import StatCard from "../../components/ui/Card";
import { formatCurrency } from "../../lib/utils";
import { SCHOOL_TYPES, type SchoolType } from "../../lib/constants";

export default function DashboardPage() {
  const [filter, setFilter] = useState<SchoolType | "All">("All");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of school payment statistics</p>
        </div>
        <div className="flex items-center gap-2">
          {stats && stats.totalPaid > 0 && (
            <button
              onClick={() => setShowResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset Fees Paid
            </button>
          )}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as SchoolType | "All")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="All">All School Types</option>
            {SCHOOL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
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
            value={formatCurrency(stats.totalRevenue)}
            sub="Expected fees"
            color="gray"
          />
          <StatCard
            label="Total Fees Paid"
            value={formatCurrency(stats.totalPaid)}
            color="green"
          />
          <StatCard
            label="Outstanding Fees"
            value={formatCurrency(stats.outstanding)}
            color="red"
          />
        </div>
      ) : null}

      {/* Filter note */}
      {filter !== "All" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="text-sm text-blue-800">
            Showing statistics for <strong>{filter}</strong> students only.
          </p>
        </div>
      )}

      {/* Reset Fees Confirmation Modal */}
      {showResetModal && stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => !resetting && setShowResetModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Reset Fees Paid</h3>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-red-800">
                This will permanently delete{" "}
                <strong>{stats.filteredPaymentIds.length} payment record{stats.filteredPaymentIds.length !== 1 ? "s" : ""}</strong>{" "}
                and reset the total fees paid to{" "}
                <strong>GHS 0.00</strong>.
              </p>
              <p className="text-red-700">
                <span className="font-medium">Scope:</span>{" "}
                {filter === "All" ? "All school types" : filter}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
              >
                {resetting ? "Resetting…" : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
