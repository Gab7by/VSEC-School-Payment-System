import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../lib/db";
import { VSEC_SCHOOL } from "../../lib/constants";
import AddStudentModal from "../../components/admin/AddStudentModal";
import ChangeClassModal from "../../components/admin/ChangeClassModal";
import ResetStudentPasswordModal from "../../components/admin/ResetStudentPasswordModal";
import type { Student } from "../../lib/types";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [resetPasswordStudent, setResetPasswordStudent] = useState<Student | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteStudent(studentId: string) {
    setDeleting(true);
    try {
      const result = await db.queryOnce({
        students: { $: { where: { id: studentId } }, payments: {}, individualFees: {} },
      });
      const student = result.data.students?.[0];
      const paymentIds = (student?.payments ?? []).map((p) => p.id);
      const individualFeeIds = (student?.individualFees ?? []).map((f) => f.id);
      await db.transact([
        ...paymentIds.map((pid) => db.tx.payments[pid].delete()),
        ...individualFeeIds.map((fid) => db.tx.feeTypes[fid].delete()),
        db.tx.students[studentId].delete(),
      ]);
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  const { data, isLoading } = db.useQuery({
    students: { $: { order: { createdAt: "desc" } } },
  });

  const students = data?.students ?? [];

  const filtered = search.trim()
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(search.toLowerCase()) ||
          s.studentId.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Students</h2>
          <p className="text-sm text-slate-500">
            {students.length} student{students.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all duration-150"
          style={{ background: "var(--color-primary)", boxShadow: "0 4px 12px rgba(11,61,145,0.3)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or student ID…"
          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            {search ? "No students match your search." : "No students yet. Click 'Add Student' to get started."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Student ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">School</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class / Enrollment</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className="transition-colors"
                    style={{}}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,175,55,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {student.studentId}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {student.fullName}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          student.schoolType === VSEC_SCHOOL
                            ? "text-primary"
                            : "bg-teal-100 text-teal-700"
                        }`}
                        style={student.schoolType === VSEC_SCHOOL ? { background: "rgba(212,175,55,0.12)", color: "var(--color-primary-dark)" } : {}}
                      >
                        {student.schoolType === VSEC_SCHOOL ? "VSEC College" : "Donkor Kids"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{student.phone}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700 font-medium">{student.classLevel}</p>
                      {student.schoolType === VSEC_SCHOOL && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[student.campus, student.studyMode, student.nationalityGroup].filter(Boolean).join(" · ") || "—"}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {confirmDeleteId === student.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-slate-500">Delete?</span>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            disabled={deleting}
                            className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            {deleting ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deleting}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-3">
                          <button
                            onClick={() => setEditStudent(student as Student)}
                            className="text-xs font-semibold hover:underline transition-colors"
                            style={{ color: "var(--color-primary)" }}
                          >
                            Edit Enrollment
                          </button>
                          <button
                            onClick={() => setResetPasswordStudent(student as Student)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline transition-colors"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => navigate("/admin/sms", { state: { presetStudentId: student.id } })}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline transition-colors"
                          >
                            Send SMS
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(student.id)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors"
                          >
                            Delete
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddStudentModal existingStudents={students} onClose={() => setShowAdd(false)} />}
      {editStudent && (
        <ChangeClassModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
        />
      )}
      {resetPasswordStudent && (
        <ResetStudentPasswordModal
          student={resetPasswordStudent}
          onClose={() => setResetPasswordStudent(null)}
        />
      )}
    </div>
  );
}
