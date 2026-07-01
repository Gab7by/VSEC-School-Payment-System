import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SchoolLogo() {
  return (
    <div className="animate-logo-float animate-logo-glow mb-5 inline-block">
      <img
        src="/vsec-logo.png"
        alt="VSEC"
        className="w-20 h-20 object-contain drop-shadow-lg"
      />
    </div>
  );
}

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email or phone number, and password.");
      return;
    }

    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Login failed. Please try again.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, var(--color-primary-light) 100%)" }}
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
            <label className="text-sm font-medium text-slate-700">Email or Phone Number</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone number"
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
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 14px rgba(212,175,55,0.4)" }}
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
