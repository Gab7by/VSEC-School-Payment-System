import { useState } from "react";
import { db } from "../lib/db";
import { id } from "@instantdb/react";
import { hashPassword } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export default function SetupPage() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const hash = await hashPassword(password);
      const adminId = id();
      await db.transact(
        db.tx.admins[adminId].update({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          passwordHash: hash,
          createdAt: Date.now(),
        })
      );
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Setup failed. Please try again."
      );
    } finally {
      setLoading(false);
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
          <div className="animate-logo-float animate-logo-glow mb-5 inline-block">
            <img
              src="/vsec-logo.png"
              alt="VSEC"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">VSEC School</h1>
          <p className="text-slate-500 text-sm mt-1">Payment Management System</p>
        </div>

        <div
          className="rounded-xl px-4 py-3.5 mb-6 border"
          style={{ background: "rgba(212,175,55,0.06)", borderColor: "rgba(212,175,55,0.25)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>First-time Setup</p>
          <p className="text-sm mt-0.5 text-slate-600">
            Create the administrator account to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin Name" className={inputCls} disabled={loading} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@vsec.edu.gh" className={inputCls} disabled={loading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className={inputCls} disabled={loading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className={inputCls} disabled={loading} />
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2.5 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 shadow-lg transition-all duration-150"
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 14px rgba(212,175,55,0.4)" }}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account…
              </span>
            ) : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
