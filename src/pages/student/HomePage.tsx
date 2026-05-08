import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudentPaymentSummary } from "../../hooks/useStudentPaymentSummary";
import { VSEC_SCHOOL } from "../../lib/constants";
import SummaryCards from "../../components/student/SummaryCards";
import RecentPaymentsList from "../../components/student/RecentPaymentsList";

export default function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isLoading, summary, payments } = useStudentPaymentSummary(
    session?.id ?? ""
  );

  const sortedPayments = [...payments].sort(
    (a, b) => (b.paymentDate ?? 0) - (a.paymentDate ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-blue-200 text-sm font-medium">Welcome back,</p>
        <h2 className="text-2xl font-bold mt-0.5">{session?.name}</h2>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="bg-blue-500/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            {session?.schoolType === VSEC_SCHOOL ? "VSEC College" : session?.schoolType}
          </span>
          {session?.schoolType === VSEC_SCHOOL && session?.campus && (
            <span className="bg-blue-500/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              {session.campus}
            </span>
          )}
          {session?.schoolType === VSEC_SCHOOL && session?.studyMode && (
            <span className="bg-blue-500/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              {session.studyMode}
            </span>
          )}
          <span className="bg-blue-500/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            {session?.classLevel}
          </span>
          <span className="bg-blue-500/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-mono">
            {session?.studentId}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <SummaryCards
          totalDue={summary.totalDue}
          totalPaid={summary.totalPaid}
          balance={summary.balance}
        />
      ) : null}

      {/* Pay Now button */}
      <button
        onClick={() => navigate("/student/payments")}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Pay Now
      </button>

      {/* Recent payments */}
      <RecentPaymentsList
        payments={sortedPayments}
        onViewAll={() => navigate("/student/history")}
      />
    </div>
  );
}
