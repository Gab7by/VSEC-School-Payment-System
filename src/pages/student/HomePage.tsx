import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudentPaymentSummary } from "../../hooks/useStudentPaymentSummary";
import { VSEC_SCHOOL, getCurrency } from "../../lib/constants";
import SummaryCards from "../../components/student/SummaryCards";
import RecentPaymentsList from "../../components/student/RecentPaymentsList";

export default function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { isLoading, summary, payments, currency } = useStudentPaymentSummary(
    session?.id ?? ""
  );
  const resolvedCurrency = currency ?? getCurrency(session?.nationalityGroup);

  const sortedPayments = [...payments].sort(
    (a, b) => (b.paymentDate ?? 0) - (a.paymentDate ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Welcome header — navy gradient card */}
      <div
        className="rounded-2xl p-4 sm:p-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 60%, var(--color-primary-light) 100%)" }}
      >
        <p className="text-amber-900 text-sm font-medium relative">Welcome back,</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5 relative">{session?.name}</h2>
        <div className="flex flex-wrap gap-2 mt-4 relative">
          <span className="bg-black/10 text-slate-900 text-xs px-3 py-1 rounded-full border border-black/10">
            {session?.schoolType === VSEC_SCHOOL ? "VSEC College" : session?.schoolType}
          </span>
          {session?.schoolType === VSEC_SCHOOL && session?.campus && (
            <span className="bg-black/10 text-slate-900 text-xs px-3 py-1 rounded-full border border-black/10">
              {session.campus}
            </span>
          )}
          {session?.schoolType === VSEC_SCHOOL && session?.studyMode && (
            <span className="bg-black/10 text-slate-900 text-xs px-3 py-1 rounded-full border border-black/10">
              {session.studyMode}
            </span>
          )}
          {session?.schoolType === VSEC_SCHOOL && session?.nationalityGroup && (
            <span className="bg-black/10 text-slate-900 text-xs px-3 py-1 rounded-full border border-black/10">
              {session.nationalityGroup}
            </span>
          )}
          <span className="bg-black/10 text-slate-900 text-xs px-3 py-1 rounded-full border border-black/10">
            {session?.classLevel}
          </span>
          <span className="bg-black/10 text-slate-900 text-xs px-3 py-1 rounded-full border border-black/10 font-mono">
            {session?.studentId}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <SummaryCards
          totalDue={summary.totalDue}
          totalPaid={summary.totalPaid}
          balance={summary.balance}
          currency={resolvedCurrency}
        />
      ) : null}

      {/* Pay Now button — gold CTA */}
      <button
        onClick={() => navigate("/student/payments")}
        className="w-full text-white py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5"
        style={{
          background: "var(--color-secondary)",
          boxShadow: "0 4px 16px rgba(11,61,145,0.4)",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-secondary-dark)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-secondary)")}
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
        currency={resolvedCurrency}
      />
    </div>
  );
}
