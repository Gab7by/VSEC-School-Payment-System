import { useState, type ReactElement } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChangeAdminPasswordModal from "../components/admin/ChangeAdminPasswordModal";

type AdminNavKey = "dashboard" | "students" | "fees" | "payments";

const navItems: { key: AdminNavKey; label: string; icon: ReactElement }[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: "students",
    label: "Students",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "fees",
    label: "Fees",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    key: "payments",
    label: "Payments",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export default function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (key: AdminNavKey) => location.pathname === `/admin/${key}`;
  const activeNav = navItems.find((n) => location.pathname === `/admin/${n.key}`);
  const headerTitle = activeNav?.label ?? "Admin Portal";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 flex flex-col transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
        style={{ background: "var(--color-primary)" }}
      >
        {/* Logo area */}
        <div
          className="flex items-center gap-3 px-5 py-5 border-b border-white/10"
          style={{ background: "var(--color-primary-dark)" }}
        >
          <div className="animate-logo-pulse shrink-0 rounded-full overflow-hidden bg-white w-10 h-10 flex items-center justify-center">
            <img src="/vsec-logo.png" alt="VSEC" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">VSEC School</p>
            <p className="text-xs text-white/50 mt-0.5">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { navigate(`/admin/${key}`); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive(key)
                  ? "text-white border-l-2"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
              style={isActive(key) ? {
                background: "rgba(255,255,255,0.12)",
                borderLeftColor: "var(--color-secondary)",
              } : {}}
            >
              <span style={isActive(key) ? { color: "var(--color-secondary)" } : {}}>
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Admin info at bottom */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.2)" }}>
            <p className="text-xs font-semibold text-white/80 truncate">{session?.name}</p>
            <p className="text-xs text-white/40 truncate mt-0.5">{session?.email}</p>
          </div>
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-primary/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-base font-semibold text-slate-900 hidden lg:block">
            {headerTitle}
          </h1>
          <div className="lg:hidden flex-1" />

          {/* Admin dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "var(--color-primary)" }}
              >
                {session?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {session?.name}
              </span>
              <svg className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2 animate-scale-in">
                  <button
                    onClick={() => { setMenuOpen(false); setShowChangePwd(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                  <div className="mx-4 my-1 border-t border-slate-100" />
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {showChangePwd && (
        <ChangeAdminPasswordModal onClose={() => setShowChangePwd(false)} />
      )}
    </div>
  );
}
