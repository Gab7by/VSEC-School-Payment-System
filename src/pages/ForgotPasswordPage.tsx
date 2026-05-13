import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/db";
import { hashPassword } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

type Step = "email" | "otp" | "newPassword";

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export default function ForgotPasswordPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [userInfo, setUserInfo] = useState<{
    id: string;
    role: "admin" | "student";
  } | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError("Please enter your email address."); return; }

    setLoading(true);
    try {
      const [adminResult, studentResult] = await Promise.all([
        db.queryOnce({ admins: { $: { where: { email: normalizedEmail } } } }),
        db.queryOnce({ students: { $: { where: { email: normalizedEmail } } } }),
      ]);
      const admin = adminResult.data.admins?.[0];
      const student = studentResult.data.students?.[0];
      if (!admin && !student) { setError("No account found with this email address."); setLoading(false); return; }
      setUserInfo({ id: admin ? admin.id : student!.id, role: admin ? "admin" : "student" });
      await db.auth.sendMagicCode({ email: normalizedEmail });
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otp.trim()) { setError("Please enter the verification code."); return; }
    setLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: email.trim().toLowerCase(), code: otp.trim() });
      setStep("newPassword");
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setLoading(true);
    try {
      await db.auth.sendMagicCode({ email: email.trim().toLowerCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newPassword || !confirmPassword) { setError("Please fill in both password fields."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!userInfo) { setError("Session error. Please start over."); return; }

    setLoading(true);
    try {
      const hash = await hashPassword(newPassword);
      if (userInfo.role === "admin") {
        await db.transact(db.tx.admins[userInfo.id].update({ passwordHash: hash }));
      } else {
        await db.transact(db.tx.students[userInfo.id].update({ passwordHash: hash, isFirstLogin: false }));
      }
      await db.auth.signOut();
      await login(email, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  const steps: Step[] = ["email", "otp", "newPassword"];
  const stepIdx = steps.indexOf(step);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 50%, var(--color-primary-light) 100%)" }}
    >
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "var(--color-secondary)" }} />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-5 bg-white" />

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-scale-in">
        <div className="text-center mb-7">
          <div className="flex flex-col items-center gap-1 mb-4">
            <img
              src="/vsec-logo.png"
              alt="VSEC"
              className="w-14 h-14 object-contain animate-logo-float"
            />
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center -mt-1"
              style={{ background: "var(--color-primary)" }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && `Code sent to ${email}`}
            {step === "newPassword" && "Set your new password"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={
                  i < stepIdx
                    ? { background: "#10b981", color: "white" }
                    : step === s
                    ? { background: "var(--color-primary)", color: "white" }
                    : { background: "#e2e8f0", color: "#94a3b8" }
                }
              >
                {i < stepIdx ? "✓" : i + 1}
              </div>
              {i < 2 && (
                <div
                  className="w-8 h-0.5 transition-colors"
                  style={{ background: i < stepIdx ? "#10b981" : "#e2e8f0" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className={inputCls} disabled={loading} autoFocus />
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{error}</p>}
            <button type="submit" disabled={loading} className="w-full text-white py-2.5 rounded-xl font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-all" style={{ background: "var(--color-primary)" }}>
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span> : "Send Reset Code"}
            </button>
            <button type="button" onClick={() => navigate("/login")} className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors">
              ← Back to login
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Verification Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit code" maxLength={6} className={`${inputCls} tracking-widest text-center font-mono text-lg`} disabled={loading} autoFocus />
              <p className="text-xs text-slate-400">Check your email inbox for a 6-digit code.</p>
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{error}</p>}
            <button type="submit" disabled={loading} className="w-full text-white py-2.5 rounded-xl font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-all" style={{ background: "var(--color-primary)" }}>
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</span> : "Verify Code"}
            </button>
            <div className="text-center flex justify-center gap-5">
              <button type="button" onClick={handleResendOtp} disabled={loading} className="text-sm font-medium hover:underline disabled:opacity-60 transition-colors" style={{ color: "var(--color-primary)" }}>Resend Code</button>
              <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="text-sm text-slate-500 hover:text-slate-700">Change Email</button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" className={inputCls} disabled={loading} autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className={inputCls} disabled={loading} />
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{error}</p>}
            <button type="submit" disabled={loading} className="w-full text-white py-2.5 rounded-xl font-semibold disabled:opacity-60 hover:-translate-y-0.5 transition-all" style={{ background: "var(--color-primary)" }}>
              {loading ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting…</span> : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
