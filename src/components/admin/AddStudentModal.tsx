import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import {
  generateStudentId,
  generatePassword,
  hashPassword,
} from "../../lib/utils";
import {
  SCHOOL_TYPES,
  CLASS_LEVELS,
  VSEC_SCHOOL,
  VSEC_CAMPUSES,
  VSEC_STUDY_MODES,
  VSEC_NATIONALITY_GROUPS,
  type SchoolType,
  type VsecCampus,
  type VsecStudyMode,
  type VsecNationalityGroup,
} from "../../lib/constants";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
  existingStudents: Array<{ studentId?: string; schoolType?: string; phone?: string }>;
};
type Step = "form" | "success";

export default function AddStudentModal({ onClose, existingStudents }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolType, setSchoolType] = useState<SchoolType | "">("");
  const [classLevel, setClassLevel] = useState("");
  const [campus, setCampus] = useState<VsecCampus | "">("");
  const [studyMode, setStudyMode] = useState<VsecStudyMode | "">("");
  const [nationalityGroup, setNationalityGroup] = useState<VsecNationalityGroup | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const studentId = useMemo(() => {
    if (!schoolType || !classLevel) return "";
    if (schoolType === VSEC_SCHOOL && !nationalityGroup) return "";
    return generateStudentId(schoolType, nationalityGroup || undefined, classLevel, existingStudents);
  }, [schoolType, nationalityGroup, classLevel, existingStudents]);

  const isVsec = schoolType === VSEC_SCHOOL;

  const classOptions = useMemo(
    () => (schoolType ? CLASS_LEVELS[schoolType] : []),
    [schoolType]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !schoolType || !classLevel || !studentId) {
      setError("All fields are required.");
      return;
    }
    if (isVsec && (!campus || !studyMode || !nationalityGroup)) {
      setError("Campus, Study Mode, and Nationality Group are required for VSEC College of Studies.");
      return;
    }
    if (existingStudents.some((s) => s.phone === phone.trim())) {
      setError("A student with this phone number already exists.");
      return;
    }

    setLoading(true);
    try {
      const password = generatePassword();
      const hash = await hashPassword(password);
      const newId = id();

      await db.transact(
        db.tx.students[newId].update({
          studentId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          schoolType,
          classLevel,
          ...(isVsec ? { campus, studyMode, nationalityGroup } : {}),
          passwordHash: hash,
          isFirstLogin: true,
          createdAt: Date.now(),
        })
      );

      setGeneratedPassword(password);
      setStep("success");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create student. Phone number may already be registered."
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

  if (step === "success") {
    return (
      <Modal title="Student Created" onClose={onClose}>
        <div className="space-y-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-3">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-gray-900">{fullName}</p>
            <p className="text-sm text-gray-500">{phone}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Student ID</span>
              <span className="font-mono font-medium">{studentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">School</span>
              <span className="font-medium text-right max-w-[60%]">{schoolType}</span>
            </div>
            {isVsec && campus && (
              <div className="flex justify-between">
                <span className="text-gray-500">Campus</span>
                <span className="font-medium">{campus}</span>
              </div>
            )}
            {isVsec && studyMode && (
              <div className="flex justify-between">
                <span className="text-gray-500">Study Mode</span>
                <span className="font-medium">{studyMode}</span>
              </div>
            )}
            {isVsec && nationalityGroup && (
              <div className="flex justify-between">
                <span className="text-gray-500">Nationality Group</span>
                <span className="font-medium">{nationalityGroup}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Class</span>
              <span className="font-medium text-right max-w-[60%]">{classLevel}</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Generated Password</p>
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
              Share these credentials with the student. They will be prompted to change their password on first login.
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
    <Modal title="Add Student" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Kwame Asante"
          disabled={loading}
        />

        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 0244123456"
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student ID <span className="text-gray-400 font-normal">(auto-generated)</span>
          </label>
          <input
            readOnly
            value={studentId || "—"}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono text-gray-700"
          />
          {!studentId && schoolType && (
            <p className="text-xs text-gray-400 mt-1">
              {schoolType === VSEC_SCHOOL
                ? "Select nationality group and class level to generate ID"
                : "Select class level to generate ID"}
            </p>
          )}
        </div>

        <Select
          label="School Type"
          value={schoolType}
          onChange={(e) => {
            setSchoolType(e.target.value as SchoolType);
            setClassLevel("");
            setCampus("");
            setStudyMode("");
            setNationalityGroup("");
          }}
          placeholder="Select school type"
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

        <Select
          label="Class Level"
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          placeholder="Select class"
          disabled={!schoolType || loading}
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
            Create Student
          </Button>
        </div>
      </form>
    </Modal>
  );
}
