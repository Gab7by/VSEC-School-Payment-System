import { useState } from "react";
import { db } from "../../lib/db";
import { getCurrency } from "../../lib/constants";
import { formatCurrency } from "../../lib/utils";
import { feeMatchesStudent } from "../../lib/feeMatching";
import type { Student, FeeTypeForStudent } from "../../lib/types";
import Modal from "../ui/Modal";
import EditFeeTypeModal from "./EditFeeTypeModal";
import PersonalizeFeeModal from "./PersonalizeFeeModal";

type Props = {
  student: Student;
  onClose: () => void;
};

export default function StudentFeesModal({ student, onClose }: Props) {
  const [personalizeFee, setPersonalizeFee] = useState<FeeTypeForStudent | null>(null);
  const [editFeeType, setEditFeeType] = useState<FeeTypeForStudent | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = db.useQuery({
    students: {
      $: { where: { id: student.id } },
      payments: { feeType: {} },
    },
    feeTypes: { assignedStudent: {}, excludedStudents: {}, overridesFeeType: {} },
  });

  const studentRow = data?.students?.[0];
  const allFeeTypes = data?.feeTypes ?? [];
  const payments = studentRow?.payments ?? [];

  const currentFees = studentRow
    ? allFeeTypes.filter((ft) => feeMatchesStudent(ft, studentRow))
    : [];

  async function handleDeleteGeneral(ft: FeeTypeForStudent) {
    setDeleting(true);
    try {
      await db.transact(db.tx.feeTypes[ft.id].link({ excludedStudents: student.id }));
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteIndividual(ft: FeeTypeForStudent) {
    setDeleting(true);
    try {
      await db.transact(db.tx.feeTypes[ft.id].delete());
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal title={`Manage Fees — ${student.fullName}`} onClose={onClose} maxWidth="max-w-3xl">
      <p className="text-xs text-slate-500 mb-4">
        Editing or deleting a fee here only affects {student.fullName.split(" ")[0]} — general fees and other students are never changed.
      </p>

      {isLoading ? (
        <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
      ) : currentFees.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-sm">
          No fees currently apply to this student.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Term</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentFees.map((ft) => {
                  const isIndividual = !!ft.assignedStudent;
                  const isPersonalized = isIndividual && !!ft.overridesFeeType;
                  const currency = getCurrency(ft.nationalityGroup);

                  return (
                    <tr key={ft.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{ft.feeName}</p>
                        {isPersonalized && ft.overridesFeeType && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Personalized from "{ft.overridesFeeType.feeName}"
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        {formatCurrency(ft.amount ?? 0, currency)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{ft.term}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold"
                          style={
                            isPersonalized
                              ? { background: "rgba(212,175,55,0.15)", color: "var(--color-secondary-dark)" }
                              : isIndividual
                              ? { background: "rgba(168,85,247,0.12)", color: "#7e22ce" }
                              : { background: "rgba(11,61,145,0.1)", color: "var(--color-primary)" }
                          }
                        >
                          {isPersonalized ? "Personalized" : isIndividual ? "Individual" : "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmDeleteId === ft.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {isIndividual ? "Remove?" : "Remove for this student only?"}
                            </span>
                            <button
                              onClick={() =>
                                isIndividual ? handleDeleteIndividual(ft) : handleDeleteGeneral(ft)
                              }
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
                          <span className="inline-flex items-center gap-3 justify-end">
                            <button
                              onClick={() =>
                                isIndividual ? setEditFeeType(ft) : setPersonalizeFee(ft)
                              }
                              className="text-xs font-semibold hover:underline transition-colors"
                              style={{ color: "var(--color-primary)" }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(ft.id)}
                              className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline transition-colors"
                            >
                              Delete
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {personalizeFee && studentRow && (
        <PersonalizeFeeModal
          generalFee={personalizeFee}
          student={student}
          existingPayments={payments}
          onClose={() => setPersonalizeFee(null)}
        />
      )}
      {editFeeType && (
        <EditFeeTypeModal
          feeType={editFeeType}
          onClose={() => setEditFeeType(null)}
        />
      )}
    </Modal>
  );
}
