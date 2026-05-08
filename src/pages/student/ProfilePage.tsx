import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/utils";
import { VSEC_SCHOOL } from "../../lib/constants";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function ProfilePage() {
  const { session, refreshSession } = useAuth();

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(session?.name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  // Change password
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
      // Verify current password
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
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-500">Manage your personal information</p>
      </div>

      {/* First-login banner */}
      {session?.isFirstLogin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              Please change your default password
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              You are using a system-generated password. Change it below for security.
            </p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">Personal Information</h3>
          {!editingName && (
            <button
              onClick={() => { setEditingName(true); setNewName(session?.name ?? ""); }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Edit Name
            </button>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {editingName ? (
            <form onSubmit={handleSaveName} className="flex gap-2 items-end">
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
                variant="secondary"
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
            </>
          )}
          <InfoRow label="Class" value={session?.classLevel ?? "—"} />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Change Password</h3>

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
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {pwdError}
            </p>
          )}
          {pwdSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
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
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-800 font-medium text-right ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
