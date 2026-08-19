import { useState } from "react";
import { db } from "../../lib/db";
import { VSEC_SCHOOL, ALL_CAMPUSES_LABEL, ALL_STUDY_MODES_LABEL, getCurrency } from "../../lib/constants";
import CreateFeeTypeForm from "../../components/admin/CreateFeeTypeForm";
import AssignIndividualFeeForm from "../../components/admin/AssignIndividualFeeForm";
import { formatCurrency } from "../../lib/utils";

export default function FeesPage() {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = db.useQuery({
    feeTypes: { $: { order: { createdAt: "desc" } }, assignedStudent: {} },
  });

  const feeTypes = data?.feeTypes ?? [];

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await db.transact(db.tx.feeTypes[id].delete());
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Fee Management</h2>
        <p className="text-sm text-slate-500">Create and manage school fee types</p>
      </div>

      <CreateFeeTypeForm />

      <AssignIndividualFeeForm />

      {/* Existing fee types table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Existing Fee Types ({feeTypes.length})
        </h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
          ) : feeTypes.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No fee types created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">School</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus / Mode / Group</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Term</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feeTypes.map((ft) => {
                    const currency = getCurrency(ft.nationalityGroup);
                    const isIntl = ft.schoolType === VSEC_SCHOOL && ft.nationalityGroup === "International";
                    return (
                      <tr
                        key={ft.id}
                        className="transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(11,61,145,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{ft.feeName}</p>
                          {ft.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{ft.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold ${isIntl ? "text-blue-700" : "text-emerald-700"}`}>
                            {formatCurrency(ft.amount ?? 0, currency)}
                          </span>
                          {ft.schoolType === VSEC_SCHOOL && (
                            <span
                              className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
                              style={
                                isIntl
                                  ? { background: "rgba(212,175,55,0.15)", color: "var(--color-secondary-dark)" }
                                  : { background: "rgba(16,185,129,0.1)", color: "#065f46" }
                              }
                            >
                              {currency}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {ft.assignedStudent ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                              style={{ background: "rgba(168,85,247,0.12)", color: "#7e22ce" }}
                            >
                              Individual: {ft.assignedStudent.fullName}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                              style={
                                ft.schoolType === VSEC_SCHOOL
                                  ? { background: "rgba(11,61,145,0.1)", color: "var(--color-primary)" }
                                  : { background: "#ccfbf1", color: "#0f766e" }
                              }
                            >
                              {ft.schoolType === VSEC_SCHOOL ? "VSEC College" : "Donkor Kids"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {ft.assignedStudent ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : ft.schoolType === VSEC_SCHOOL ? (
                            <div>
                              <p className="text-xs text-slate-700 font-medium">
                                {ft.allCampuses ? ALL_CAMPUSES_LABEL : (ft.campus || "—")}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {ft.allStudyModes ? ALL_STUDY_MODES_LABEL : (ft.studyMode || "—")}
                              </p>
                              {ft.nationalityGroup && (
                                <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                                  {ft.nationalityGroup}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {ft.assignedStudent ? "—" : ft.classLevel}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{ft.term}</td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {confirmDeleteId === ft.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-xs text-slate-500">Delete?</span>
                              <button
                                onClick={() => handleDelete(ft.id)}
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
                            <button
                              onClick={() => setConfirmDeleteId(ft.id)}
                              className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
