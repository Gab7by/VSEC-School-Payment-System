import { useState } from "react";
import { db } from "../../lib/db";
import { generatePassword, hashPassword } from "../../lib/utils";
import type { Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

type Props = {
  student: Student;
  onClose: () => void;
};

export default function ResetStudentPasswordModal({ student, onClose }: Props) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    setError("");
    setLoading(true);
    try {
      const password = generatePassword();
      const hash = await hashPassword(password);
      await db.transact(
        db.tx.students[student.id].update({
          passwordHash: hash,
          isFirstLogin: true,
        })
      );
      setGeneratedPassword(password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (generatedPassword) {
    return (
      <Modal title="Password Reset" onClose={onClose}>
        <div className="space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">{student.fullName}</p>
            <p className="text-sm text-gray-500">{student.phone}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">New Password</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 font-mono text-base tracking-widest text-yellow-900 text-center">
                {generatedPassword}
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this password with the student. Their old password no longer works, and they will be prompted to change this one on next login.
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Reset Password" onClose={onClose}>
      <div className="space-y-5">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-gray-800">{student.fullName}</p>
          <p className="text-gray-500 text-xs mt-0.5">{student.phone}</p>
        </div>

        <p className="text-sm text-gray-600">
          This will generate a new password for {student.fullName}. Their
          current password will stop working immediately.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleReset} loading={loading} className="flex-1">
            Generate New Password
          </Button>
        </div>
      </div>
    </Modal>
  );
}
