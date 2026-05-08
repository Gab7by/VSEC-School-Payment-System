import { useEffect, type ReactElement } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type StudentNavKey = "home" | "payments" | "history" | "profile";

type NavItem = {
  key: StudentNavKey;
  label: string;
  icon: (active: boolean) => ReactElement;
};

const navItems: NavItem[] = [
  {
    key: "home",
    label: "Home",
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: "payments",
    label: "Payments",
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    key: "history",
    label: "History",
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function StudentLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session?.isFirstLogin && location.pathname !== "/student/profile") {
      navigate("/student/profile", { replace: true });
    }
  }, [session?.isFirstLogin, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-10 shadow-sm px-4 py-3 flex items-center justify-between" style={{ background: "var(--color-primary)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--color-secondary)" }}
          >
            <svg className="w-5 h-5" style={{ color: "var(--color-primary-dark)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 12c0 2.485-.82 4.777-2.19 6.617L12 22l-6.81-3.383A12.083 12.083 0 013 12c0-.935.116-1.844.336-2.711L12 14z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">VSEC School</p>
            <p className="text-xs text-white/50">Student Portal</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-10">
        <div className="flex">
          {navItems.map(({ key, label, icon }) => {
            const active = location.pathname === `/student/${key}`;
            return (
              <button
                key={key}
                onClick={() => navigate(`/student/${key}`)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
                style={{ color: active ? "var(--color-primary)" : undefined }}
              >
                <span className={active ? "" : "text-slate-400"}>
                  {icon(active)}
                </span>
                <span className={`text-xs font-semibold ${active ? "" : "text-slate-400"}`}>
                  {label}
                </span>
                {active && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-secondary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
