import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import { TERMS_BY_SCHOOL, ALL_TERMS_LABEL, type SchoolType, type Term } from "../../lib/constants";
import type { FeeTypeForStudent, Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Button from "../ui/Button";

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

type Props = {
  generalFee: FeeTypeForStudent;
  student: Student;
  existingPayments: Array<{ id: string; feeType?: { id: string } | null }>;
  onClose: () => void;
};

export default function PersonalizeFeeModal({ generalFee, student, existingPayments, onClose }: Props) {
  const [feeName, setFeeName] = useState(generalFee.feeName ?? "");
  const [amount, setAmount] = useState(String(generalFee.amount ?? ""));
  const [description, setDescription] = useState(generalFee.description ?? "");
  const [term, setTerm] = useState<Term | "">(
    generalFee.allTerms ? "" : ((generalFee.term as Term) ?? "")
  );
  const [applyAllTerms, setApplyAllTerms] = useState(!!generalFee.allTerms);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const termOptions = useMemo(
    () => TERMS_BY_SCHOOL[generalFee.schoolType as SchoolType] ?? [],
    [generalFee.schoolType]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!feeName.trim() || !amount || (!applyAllTerms && !term)) {
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
      const newFeeId = id();
      const paymentsToRelink = existingPayments
        .filter((p) => p.feeType?.id === generalFee.id)
        .map((p) => p.id);

      await db.transact([
        db.tx.feeTypes[newFeeId]
          .update({
            feeName: feeName.trim(),
            amount: numAmount,
            description: description.trim() || "",
            schoolType: generalFee.schoolType,
            classLevel: generalFee.classLevel,
            allClasses: false,
            campus: generalFee.campus ?? "",
            allCampuses: false,
            studyMode: generalFee.studyMode ?? "",
            allStudyModes: false,
            nationalityGroup: generalFee.nationalityGroup ?? "",
            term: applyAllTerms ? ALL_TERMS_LABEL : term,
            allTerms: applyAllTerms,
            createdAt: Date.now(),
          })
          .link({ assignedStudent: student.id })
          .link({ overridesFeeType: generalFee.id }),
        db.tx.feeTypes[generalFee.id].link({ excludedStudents: student.id }),
        ...paymentsToRelink.map((pid) => db.tx.payments[pid].link({ feeType: newFeeId })),
      ]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to personalize fee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Personalize Fee" onClose={onClose}>
      <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
        <p className="font-medium text-gray-800">{student.fullName}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          This creates a personal version of "{generalFee.feeName}" for {student.fullName} only.
          The general fee stays unchanged for every other student.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Term</label>
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyAllTerms}
                onChange={(e) => {
                  setApplyAllTerms(e.target.checked);
                  setTerm("");
                }}
                disabled={loading}
                style={{ accentColor: "var(--color-primary)" }}
                className="w-3.5 h-3.5 rounded"
              />
              Apply to all terms
            </label>
          </div>
          <Select
            value={term}
            onChange={(e) => setTerm(e.target.value as Term)}
            placeholder="Select term"
            disabled={loading || applyAllTerms}
          >
            {termOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Fee Name</label>
          <input
            type="text"
            value={feeName}
            onChange={(e) => setFeeName(e.target.value)}
            placeholder="e.g. Total Admission Fee"
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
            placeholder="e.g. 500.00"
            disabled={loading}
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Discounted fee arrangement"
            disabled={loading}
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
        </div>

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
            Save for {student.fullName.split(" ")[0]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
