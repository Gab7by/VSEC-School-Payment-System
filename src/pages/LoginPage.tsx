import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SchoolLogo() {
  return (
    <div
      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 ring-4"
      style={{ background: "var(--color-primary)" }}
    >
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 12c0 2.485-.82 4.777-2.19 6.617L12 22l-6.81-3.383A12.083 12.083 0 013 12c0-2.485.82-4.777 2.19-6.617L12 9l6.16 3.422z" />
      </svg>
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Login failed. Please try again.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, #1a52b3 100%)" }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "var(--color-secondary)" }} />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5 bg-white" />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-scale-in">
        <div className="text-center mb-7">
          <SchoolLogo />
          <h1 className="text-2xl font-bold text-slate-900">VSEC School</h1>
          <p className="text-slate-500 text-sm mt-1">Payment Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={inputCls}
              style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={inputCls}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2.5 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 hover:-translate-y-0.5 shadow-lg transition-all duration-150"
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 14px rgba(11,61,145,0.4)" }}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in…
              </span>
            ) : "Sign In"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              Forgot password?
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-7">
          © {new Date().getFullYear()} VSEC School. All rights reserved.
        </p>
      </div>
    </div>
  );
}
