import { useState } from "react";
import { useAdminDashboardStats } from "../../hooks/useAdminDashboardStats";
import StatCard from "../../components/ui/Card";
import { formatCurrency } from "../../lib/utils";
import { SCHOOL_TYPES, type SchoolType } from "../../lib/constants";

export default function DashboardPage() {
  const [filter, setFilter] = useState<SchoolType | "All">("All");
  const { isLoading, stats } = useAdminDashboardStats(filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of school payment statistics</p>
        </div>
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
    </div>
  );
}
