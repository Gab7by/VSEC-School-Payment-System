import { useState } from "react";
import { db } from "../lib/db";
import { hashPassword } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

type Props = {
  onBack: () => void;
};

type Step = "email" | "otp" | "newPassword";

export default function ForgotPasswordPage({ onBack }: Props) {
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Stores which table the user was found in after email verification
  const [userInfo, setUserInfo] = useState<{
    id: string;
    role: "admin" | "student";
  } | null>(null);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      // Verify email exists in our system
      const adminResult = await db.queryOnce({
        admins: { $: { where: { email: normalizedEmail } } },
      });
      const studentResult = await db.queryOnce({
        students: { $: { where: { email: normalizedEmail } } },
      });

      const admin = adminResult.data.admins?.[0];
      const student = studentResult.data.students?.[0];

      if (!admin && !student) {
        setError("No account found with this email address.");
        setLoading(false);
        return;
      }

      setUserInfo({
        id: admin ? admin.id : student!.id,
        role: admin ? "admin" : "student",
      });

      await db.auth.sendMagicCode({ email: normalizedEmail });
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send code. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      await db.auth.signInWithMagicCode({
        email: email.trim().toLowerCase(),
        code: otp.trim(),
      });
      setStep("newPassword");
    } catch (err) {
      setError(
        err instanceof Error
          ? "Invalid or expired code. Please try again."
          : "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setLoading(true);
    try {
      await db.auth.sendMagicCode({ email: email.trim().toLowerCase() });
      setError(""); // clear any previous error
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend code."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!userInfo) {
      setError("Session error. Please start over.");
      return;
    }

    setLoading(true);
    try {
      const hash = await hashPassword(newPassword);
      const table = userInfo.role === "admin" ? "admins" : "students";

      if (table === "admins") {
        await db.transact(
          db.tx.admins[userInfo.id].update({ passwordHash: hash })
        );
      } else {
        await db.transact(
          db.tx.students[userInfo.id].update({
            passwordHash: hash,
            isFirstLogin: false,
          })
        );
      }

      // Clear InstantDB's temporary auth session
      await db.auth.signOut();

      // Log in with the new password using our custom auth
      await login(email, newPassword);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-1">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && `Code sent to ${email}`}
            {step === "newPassword" && "Set your new password"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["email", "otp", "newPassword"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s
                    ? "bg-blue-600 text-white"
                    : i < ["email", "otp", "newPassword"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < ["email", "otp", "newPassword"].indexOf(step) ? "✓" : i + 1}
              </div>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Sending…" : "Send Reset Code"}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to login
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Check your email inbox for a 6-digit code.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Verifying…" : "Verify Code"}
            </button>
            <div className="text-center space-x-4">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm text-blue-600 hover:underline disabled:opacity-60"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
