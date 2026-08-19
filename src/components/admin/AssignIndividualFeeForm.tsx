import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import { TERMS_BY_SCHOOL, type SchoolType, type Term } from "../../lib/constants";
import Select from "../ui/Select";
import Button from "../ui/Button";

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export default function AssignIndividualFeeForm() {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [feeName, setFeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState<Term | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data } = db.useQuery({ students: {} });
  const allStudents = data?.students ?? [];

  const matchingStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return [];
    return allStudents.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
    );
  }, [studentSearch, allStudents]);

  const selectedStudent = allStudents.find((s) => s.id === selectedStudentId);

  const termOptions = selectedStudent
    ? TERMS_BY_SCHOOL[selectedStudent.schoolType as SchoolType]
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedStudent) {
      setError("Please select a student.");
      return;
    }
    if (!feeName.trim() || !amount || !term) {
      setError("Fee name, amount, and term are required.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    setLoading(true);
    try {
      await db.transact(
        db.tx.feeTypes[id()]
          .update({
            feeName: feeName.trim(),
            amount: numAmount,
            ...(description.trim() ? { description: description.trim() } : {}),
            schoolType: selectedStudent.schoolType,
            classLevel: selectedStudent.classLevel,
            allClasses: false,
            campus: selectedStudent.campus ?? "",
            allCampuses: false,
            studyMode: selectedStudent.studyMode ?? "",
            allStudyModes: false,
            nationalityGroup: selectedStudent.nationalityGroup ?? "",
            term,
            createdAt: Date.now(),
          })
          .link({ assignedStudent: selectedStudent.id })
      );
      setStudentSearch("");
      setSelectedStudentId("");
      setFeeName("");
      setAmount("");
      setDescription("");
      setTerm("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign fee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Assign Individual Fee</h3>
      <p className="text-xs text-slate-500 mb-5">
        Create a fee that applies only to one specific student, regardless of their class, campus, or nationality.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-sm font-medium text-slate-700">Student</label>
          <input
            type="text"
            value={selectedStudent ? `${selectedStudent.fullName} (${selectedStudent.studentId})` : studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value);
              setSelectedStudentId("");
            }}
            placeholder="Search by name or student ID…"
            disabled={loading}
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
          {!selectedStudent && studentSearch.trim() && (
            <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
              {matchingStudents.length === 0 ? (
                <p className="px-4 py-2.5 text-xs text-slate-400">No students match.</p>
              ) : (
                matchingStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setStudentSearch("");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-medium text-slate-800">{s.fullName}</span>
                    <span className="text-xs text-slate-400 ml-2">{s.studentId}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Select
          label="Term"
          value={term}
          onChange={(e) => setTerm(e.target.value as Term)}
          placeholder="Select term"
          disabled={!selectedStudent || loading}
        >
          {termOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Fee Name</label>
          <input
            type="text"
            value={feeName}
            onChange={(e) => setFeeName(e.target.value)}
            placeholder="e.g. Makeup Exam Fee"
            disabled={loading}
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100.00"
            disabled={loading}
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Retake fee for missed Term 2 exam"
            disabled={loading}
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" loading={loading} className="w-full">
            Assign Fee
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          Fee assigned successfully!
        </p>
      )}
    </form>
  );
}
