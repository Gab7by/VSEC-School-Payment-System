import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/utils";
import { VSEC_SCHOOL } from "../../lib/constants";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ProfilePage() {
  const { session, refreshSession } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(session?.name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    if (!newName.trim()) {
      setNameError("Name cannot be empty.");
      return;
    }
    if (!session) return;
    setNameLoading(true);
    try {
      await db.transact(
        db.tx.students[session.id].update({ fullName: newName.trim() })
      );
      refreshSession({ name: newName.trim() });
      setEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setNameLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError("All fields are required.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (!session) return;

    setPwdLoading(true);
    try {
      const result = await db.queryOnce({
        students: { $: { where: { id: session.id } } },
      });
      const student = result.data.students?.[0];
      const currentHash = await hashPassword(currentPwd);

      if (!student || student.passwordHash !== currentHash) {
        setPwdError("Current password is incorrect.");
        setPwdLoading(false);
        return;
      }

      const newHash = await hashPassword(newPwd);
      await db.transact(
        db.tx.students[session.id].update({
          passwordHash: newHash,
          isFirstLogin: false,
        })
      );
      refreshSession({ isFirstLogin: false });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setPwdSuccess(true);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        <p className="text-sm text-slate-500">Manage your personal information</p>
      </div>

      {/* First-login banner */}
      {session?.isFirstLogin && (
        <div
          className="rounded-2xl p-4 flex gap-3 border"
          style={{ background: "linear-gradient(135deg, rgba(11,61,145,0.07) 0%, rgba(11,61,145,0.04) 100%)", borderColor: "rgba(11,61,145,0.2)" }}
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: "var(--color-secondary-dark)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Please change your default password
            </p>
            <p className="text-xs text-amber-800/70 mt-0.5">
              You are using a system-generated password. Change it below for security.
            </p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-900">Personal Information</h3>
          {!editingName && (
            <button
              onClick={() => { setEditingName(true); setNewName(session?.name ?? ""); }}
              className="text-xs font-semibold hover:underline transition-colors"
              style={{ color: "var(--color-primary)" }}
            >
              Edit Name
            </button>
          )}
        </div>

        <div className="space-y-1 text-sm">
          {editingName ? (
            <form onSubmit={handleSaveName} className="flex gap-2 items-end pb-3">
              <div className="flex-1">
                <Input
                  label="Full Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  error={nameError}
                  disabled={nameLoading}
                />
              </div>
              <Button type="submit" loading={nameLoading} size="sm">Save</Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setEditingName(false); setNameError(""); }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <InfoRow label="Full Name" value={session?.name ?? "—"} />
          )}
          <InfoRow label="Student ID" value={session?.studentId ?? "—"} mono />
          <InfoRow label="Email" value={session?.email ?? "—"} />
          <InfoRow label="School" value={session?.schoolType ?? "—"} />
          {session?.schoolType === VSEC_SCHOOL && (
            <>
              <InfoRow label="Campus" value={session?.campus ?? "—"} />
              <InfoRow label="Study Mode" value={session?.studyMode ?? "—"} />
              <InfoRow label="Nationality Group" value={session?.nationalityGroup ?? "—"} />
            </>
          )}
          <InfoRow label="Class" value={session?.classLevel ?? "—"} />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-5">Change Password</h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Enter current password"
            disabled={pwdLoading}
          />
          <Input
            label="New Password"
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Min. 8 characters"
            disabled={pwdLoading}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Repeat new password"
            disabled={pwdLoading}
          />

          {pwdError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
              {pwdError}
            </p>
          )}
          {pwdSuccess && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              Password updated successfully!
            </p>
          )}

          <Button type="submit" loading={pwdLoading} className="w-full">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 shrink-0 text-sm">{label}</span>
      <span className={`text-slate-900 font-semibold text-right text-sm ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
