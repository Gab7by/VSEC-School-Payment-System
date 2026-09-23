import { useState } from "react";
import { db } from "../../lib/db";
import type { Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";

type Props = {
  student: Student;
  existingStudents: Student[];
  onClose: () => void;
};

export default function EditStudentEmailModal({ student, existingStudents, onClose }: Props) {
  const [email, setEmail] = useState(student.email ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail &&
      existingStudents.some((s) => s.id !== student.id && s.email?.toLowerCase() === normalizedEmail)
    ) {
      setError("Another student already uses this email address.");
      return;
    }

    setLoading(true);
    try {
      if (normalizedEmail) {
        const adminCheck = await db.queryOnce({
          admins: { $: { where: { email: normalizedEmail } } },
        });
        if (adminCheck.data.admins?.[0]) {
          setError("This email address is already associated with an admin account.");
          setLoading(false);
          return;
        }
      }

      await db.transact(
        db.tx.students[student.id].update({ email: normalizedEmail || null })
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update email. It may already be registered."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Edit Email" onClose={onClose}>
      <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-gray-800">{student.fullName}</p>
        <p className="text-gray-500 text-xs mt-0.5">{student.studentId} — {student.phone}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. student@example.com"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 -mt-2">
          Leave blank to remove this student's email and keep phone-only login.
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
          <Button type="submit" loading={loading} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
