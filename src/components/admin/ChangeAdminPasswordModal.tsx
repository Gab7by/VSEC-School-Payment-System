import { useState } from "react";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
};

export default function ChangeAdminPasswordModal({ onClose }: Props) {
  const { session } = useAuth();
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!current || !newPwd || !confirm) {
      setError("All fields are required.");
      return;
    }
    if (newPwd !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (newPwd.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (!session) return;

    setLoading(true);
    try {
      // Verify current password
      const result = await db.queryOnce({
        admins: { $: { where: { id: session.id } } },
      });
      const admin = result.data.admins?.[0];
      const currentHash = await hashPassword(current);

      if (!admin || admin.passwordHash !== currentHash) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }

      const newHash = await hashPassword(newPwd);
      await db.transact(
        db.tx.admins[session.id].update({ passwordHash: newHash })
      );
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Modal title="Password Changed" onClose={onClose}>
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-4">Your password has been updated successfully.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Change Password" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Enter current password"
          disabled={loading}
        />
        <Input
          label="New Password"
          type="password"
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
          placeholder="Min. 8 characters"
          disabled={loading}
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          disabled={loading}
        />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
