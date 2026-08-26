import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import {
  SCHOOL_TYPES,
  CLASS_LEVELS,
  TERMS_BY_SCHOOL,
  VSEC_SCHOOL,
  VSEC_CAMPUSES,
  VSEC_STUDY_MODES,
  VSEC_NATIONALITY_GROUPS,
  ALL_CLASSES_LABEL,
  ALL_CAMPUSES_LABEL,
  ALL_STUDY_MODES_LABEL,
  type SchoolType,
  type Term,
  type VsecNationalityGroup,
} from "../../lib/constants";
import type { FeeTypeWithStudent } from "../../lib/types";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Button from "../ui/Button";

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

type Props = {
  feeType: FeeTypeWithStudent;
  onClose: () => void;
};

export default function EditFeeTypeModal({ feeType, onClose }: Props) {
  const isIndividual = !!feeType.assignedStudent;

  const [feeName, setFeeName] = useState(feeType.feeName ?? "");
  const [amount, setAmount] = useState(String(feeType.amount ?? ""));
  const [description, setDescription] = useState(feeType.description ?? "");
  const [term, setTerm] = useState<Term | "">((feeType.term as Term) ?? "");

  const [schoolType, setSchoolType] = useState<SchoolType | "">(
    (feeType.schoolType as SchoolType) ?? ""
  );
  const [applyAllClasses, setApplyAllClasses] = useState(!!feeType.allClasses);
  const [classLevel, setClassLevel] = useState(
    feeType.allClasses ? "" : (feeType.classLevel ?? "")
  );
  const [applyAllCampuses, setApplyAllCampuses] = useState(!!feeType.allCampuses);
  const [campus, setCampus] = useState(feeType.allCampuses ? "" : (feeType.campus ?? ""));
  const [applyAllStudyModes, setApplyAllStudyModes] = useState(!!feeType.allStudyModes);
  const [studyMode, setStudyMode] = useState(
    feeType.allStudyModes ? "" : (feeType.studyMode ?? "")
  );
  const [nationalityGroup, setNationalityGroup] = useState<VsecNationalityGroup | "">(
    (feeType.nationalityGroup as VsecNationalityGroup) ?? ""
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isVsec = schoolType === VSEC_SCHOOL;

  const classOptions = useMemo(() => (schoolType ? CLASS_LEVELS[schoolType] : []), [schoolType]);
  const termOptions = useMemo(() => {
    if (isIndividual) return TERMS_BY_SCHOOL[feeType.schoolType as SchoolType] ?? [];
    return schoolType ? TERMS_BY_SCHOOL[schoolType] : [];
  }, [isIndividual, feeType.schoolType, schoolType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!feeName.trim() || !amount || !term) {
      setError("Fee name, amount, and term are required.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    if (!isIndividual) {
      if (!schoolType || (!applyAllClasses && !classLevel)) {
        setError("School type and class level are required.");
        return;
      }
      if (
        isVsec &&
        ((!applyAllCampuses && !campus) || (!applyAllStudyModes && !studyMode) || !nationalityGroup)
      ) {
        setError("Campus, Study Mode, and Nationality Group are required for VSEC College of Studies.");
        return;
      }
    }

    setLoading(true);
    try {
      await db.transact(
        db.tx.feeTypes[feeType.id].update(
          isIndividual
            ? {
                feeName: feeName.trim(),
                amount: numAmount,
                description: description.trim() || "",
                term,
              }
            : {
                feeName: feeName.trim(),
                amount: numAmount,
                description: description.trim() || "",
                schoolType,
                classLevel: applyAllClasses ? ALL_CLASSES_LABEL : classLevel,
                allClasses: applyAllClasses,
                ...(isVsec
                  ? {
                      campus: applyAllCampuses ? ALL_CAMPUSES_LABEL : campus,
                      studyMode: applyAllStudyModes ? ALL_STUDY_MODES_LABEL : studyMode,
                      allCampuses: applyAllCampuses,
                      allStudyModes: applyAllStudyModes,
                      nationalityGroup,
                    }
                  : {
                      campus: "",
                      studyMode: "",
                      allCampuses: false,
                      allStudyModes: false,
                      nationalityGroup: "",
                    }),
                term,
              }
        )
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fee type.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Edit Fee Type" onClose={onClose}>
      {isIndividual && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-gray-800">
            Individual fee for {feeType.assignedStudent?.fullName}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            The assigned student can't be changed here — delete and reassign to move this fee to someone else.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isIndividual && (
          <>
            <Select
              label="School Type"
              value={schoolType}
              onChange={(e) => {
                setSchoolType(e.target.value as SchoolType);
                setClassLevel("");
                setCampus("");
                setStudyMode("");
                setNationalityGroup("");
                setTerm("");
                setApplyAllClasses(false);
                setApplyAllCampuses(false);
                setApplyAllStudyModes(false);
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
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Campus</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applyAllCampuses}
                        onChange={(e) => {
                          setApplyAllCampuses(e.target.checked);
                          setCampus("");
                        }}
                        disabled={loading}
                        style={{ accentColor: "var(--color-primary)" }}
                        className="w-3.5 h-3.5 rounded"
                      />
                      Apply to all campuses
                    </label>
                  </div>
                  <Select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    placeholder="Select campus"
                    disabled={loading || applyAllCampuses}
                  >
                    {VSEC_CAMPUSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Study Mode</label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applyAllStudyModes}
                        onChange={(e) => {
                          setApplyAllStudyModes(e.target.checked);
                          setStudyMode("");
                        }}
                        disabled={loading}
                        style={{ accentColor: "var(--color-primary)" }}
                        className="w-3.5 h-3.5 rounded"
                      />
                      Apply to all modes
                    </label>
                  </div>
                  <Select
                    value={studyMode}
                    onChange={(e) => setStudyMode(e.target.value)}
                    placeholder="Select study mode"
                    disabled={loading || applyAllStudyModes}
                  >
                    {VSEC_STUDY_MODES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </div>

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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Class Level</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyAllClasses}
                    onChange={(e) => {
                      setApplyAllClasses(e.target.checked);
                      setClassLevel("");
                    }}
                    disabled={!schoolType || loading}
                    style={{ accentColor: "var(--color-primary)" }}
                    className="w-3.5 h-3.5 rounded"
                  />
                  Apply to all classes
                </label>
              </div>
              <Select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                placeholder="Select class"
                disabled={!schoolType || loading || applyAllClasses}
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </>
        )}

        <Select
          label="Term"
          value={term}
          onChange={(e) => setTerm(e.target.value as Term)}
          placeholder="Select term"
          disabled={loading || (!isIndividual && !schoolType)}
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
            placeholder="e.g. Retake fee for missed Term 2 exam"
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
