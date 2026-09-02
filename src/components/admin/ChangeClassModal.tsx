import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import {
  SCHOOL_TYPES,
  CLASS_LEVELS,
  VSEC_SCHOOL,
  VSEC_CAMPUSES,
  VSEC_STUDY_MODES,
  VSEC_NATIONALITY_GROUPS,
  STUDENT_TYPES,
  type SchoolType,
  type VsecCampus,
  type VsecStudyMode,
  type VsecNationalityGroup,
  type StudentType,
} from "../../lib/constants";
import type { Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Input from "../ui/Input";
import Button from "../ui/Button";

type Props = {
  student: Student;
  onClose: () => void;
};

export default function ChangeClassModal({ student, onClose }: Props) {
  const [fullName, setFullName] = useState(student.fullName ?? "");
  const [schoolType, setSchoolType] = useState<SchoolType>(
    student.schoolType as SchoolType
  );
  const [classLevel, setClassLevel] = useState(student.classLevel ?? "");
  const [campus, setCampus] = useState<VsecCampus | "">((student.campus as VsecCampus) ?? "");
  const [studyMode, setStudyMode] = useState<VsecStudyMode | "">((student.studyMode as VsecStudyMode) ?? "");
  const [nationalityGroup, setNationalityGroup] = useState<VsecNationalityGroup | "">((student.nationalityGroup as VsecNationalityGroup) ?? "");
  const [studentType, setStudentType] = useState<StudentType | "">((student.studentType as StudentType) ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isVsec = schoolType === VSEC_SCHOOL;
  const classOptions = useMemo(() => CLASS_LEVELS[schoolType] ?? [], [schoolType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter the student's full name.");
      return;
    }
    if (!classLevel) {
      setError("Please select a class.");
      return;
    }
    if (isVsec && (!campus || !studyMode || !nationalityGroup)) {
      setError("Campus, Study Mode, and Nationality Group are required for VSEC College of Studies.");
      return;
    }
    if (!isVsec && !studentType) {
      setError("Student Type is required for Donkor Kids Talent International School.");
      return;
    }

    setLoading(true);
    try {
      await db.transact(
        db.tx.students[student.id].update({
          fullName: fullName.trim(),
          schoolType,
          classLevel,
          campus: isVsec ? campus : "",
          studyMode: isVsec ? studyMode : "",
          nationalityGroup: isVsec ? nationalityGroup : "",
          studentType: isVsec ? "" : studentType,
        })
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update enrollment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Edit Enrollment" onClose={onClose}>
      <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
        <p className="text-gray-500 text-xs">{student.studentId}</p>
        <p className="text-gray-500 text-xs">
          Current: {student.schoolType}
          {student.campus ? ` — ${student.campus}` : ""}
          {student.studyMode ? ` — ${student.studyMode}` : ""}
          {(student.nationalityGroup as string | undefined) ? ` — ${student.nationalityGroup}` : ""}
          {(student.studentType as string | undefined) ? ` — ${student.studentType}` : ""}
          {student.classLevel ? ` — ${student.classLevel}` : ""}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Kwame Asante"
          disabled={loading}
        />

        <Select
          label="School Type"
          value={schoolType}
          onChange={(e) => {
            setSchoolType(e.target.value as SchoolType);
            setClassLevel("");
            setCampus("");
            setStudyMode("");
            setNationalityGroup("");
            setStudentType("");
          }}
          disabled={loading}
        >
          {SCHOOL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        {isVsec && (
          <>
            <Select
              label="Campus"
              value={campus}
              onChange={(e) => setCampus(e.target.value as VsecCampus)}
              placeholder="Select campus"
              disabled={loading}
            >
              {VSEC_CAMPUSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>

            <Select
              label="Study Mode"
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value as VsecStudyMode)}
              placeholder="Select study mode"
              disabled={loading}
            >
              {VSEC_STUDY_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>

            <Select
              label="Nationality Group"
              value={nationalityGroup}
              onChange={(e) => setNationalityGroup(e.target.value as VsecNationalityGroup)}
              placeholder="Select nationality group"
              disabled={loading}
            >
              {VSEC_NATIONALITY_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </>
        )}

        {!isVsec && (
          <Select
            label="Student Type"
            value={studentType}
            onChange={(e) => setStudentType(e.target.value as StudentType)}
            placeholder="Select student type"
            disabled={loading}
          >
            {STUDENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        )}

        <Select
          label="Class Level"
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
