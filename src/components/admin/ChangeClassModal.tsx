import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { SCHOOL_TYPES, CLASS_LEVELS, type SchoolType } from "../../lib/constants";
import type { Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  student: Student;
  onClose: () => void;
};

export default function ChangeClassModal({ student, onClose }: Props) {
  const [schoolType, setSchoolType] = useState<SchoolType>(
    student.schoolType as SchoolType
  );
  const [classLevel, setClassLevel] = useState(student.classLevel);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const classOptions = useMemo(() => CLASS_LEVELS[schoolType] ?? [], [schoolType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!classLevel) {
      setError("Please select a class.");
      return;
    }

    setLoading(true);
    try {
      await db.transact(
        db.tx.students[student.id].update({ schoolType, classLevel })
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Change Class" onClose={onClose}>
      <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-gray-800">{student.fullName}</p>
        <p className="text-gray-500 text-xs mt-0.5">{student.studentId}</p>
        <p className="text-gray-500 text-xs">
          Current: {student.schoolType} — {student.classLevel}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="School Type"
          value={schoolType}
          onChange={(e) => {
            setSchoolType(e.target.value as SchoolType);
            setClassLevel("");
          }}
          disabled={loading}
        >
          {SCHOOL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <Select
          label="New Class"
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          placeholder="Select class"
          disabled={loading}
        >
          {classOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

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
