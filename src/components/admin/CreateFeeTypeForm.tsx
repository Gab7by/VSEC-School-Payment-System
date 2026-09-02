import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
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
  ALL_TERMS_LABEL,
  ALL_STUDENT_TYPES_LABEL,
  STUDENT_TYPES,
  getCurrency,
  type SchoolType,
  type Term,
  type VsecNationalityGroup,
  type StudentType,
} from "../../lib/constants";
import Select from "../ui/Select";
import Button from "../ui/Button";

const inputCls = "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

export default function CreateFeeTypeForm() {
  const [feeName, setFeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [schoolType, setSchoolType] = useState<SchoolType | "">("");
  const [campus, setCampus] = useState("");
  const [studyMode, setStudyMode] = useState("");
  const [nationalityGroup, setNationalityGroup] = useState<VsecNationalityGroup | "">("");
  const [studentType, setStudentType] = useState<StudentType | "">("");
  const [classLevel, setClassLevel] = useState("");
  const [term, setTerm] = useState<Term | "">("");
  const [applyAllClasses, setApplyAllClasses] = useState(false);
  const [applyAllCampuses, setApplyAllCampuses] = useState(false);
  const [applyAllStudyModes, setApplyAllStudyModes] = useState(false);
  const [applyAllStudentTypes, setApplyAllStudentTypes] = useState(false);
  const [applyAllTerms, setApplyAllTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isVsec = schoolType === VSEC_SCHOOL;

  const classOptions = useMemo(() => {
    if (!schoolType) return [];
    return CLASS_LEVELS[schoolType];
  }, [schoolType]);

  const termOptions = useMemo(() => {
    if (!schoolType) return [];
    return TERMS_BY_SCHOOL[schoolType];
  }, [schoolType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !feeName.trim() ||
      !amount ||
      !schoolType ||
      (!applyAllClasses && !classLevel) ||
      (!applyAllTerms && !term)
    ) {
      setError("All fields are required.");
      return;
    }
    if (
      isVsec &&
      ((!applyAllCampuses && !campus) || (!applyAllStudyModes && !studyMode) || !nationalityGroup)
    ) {
      setError("Campus, Study Mode, and Nationality Group are required for VSEC College of Studies.");
      return;
    }
    if (!isVsec && schoolType && !applyAllStudentTypes && !studentType) {
      setError("Student Type is required for Donkor Kids Talent International School.");
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
        db.tx.feeTypes[id()].update({
          feeName: feeName.trim(),
          amount: numAmount,
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
                studentType: "",
                allStudentTypes: false,
              }
            : {
                campus: "",
                studyMode: "",
                allCampuses: false,
                allStudyModes: false,
                nationalityGroup: "",
                studentType: applyAllStudentTypes ? ALL_STUDENT_TYPES_LABEL : studentType,
                allStudentTypes: applyAllStudentTypes,
              }),
          term: applyAllTerms ? ALL_TERMS_LABEL : term,
          allTerms: applyAllTerms,
          createdAt: Date.now(),
        })
      );
      setFeeName("");
      setAmount("");
      setSchoolType("");
      setCampus("");
      setStudyMode("");
      setNationalityGroup("");
      setStudentType("");
      setClassLevel("");
      setTerm("");
      setApplyAllClasses(false);
      setApplyAllCampuses(false);
      setApplyAllStudyModes(false);
      setApplyAllStudentTypes(false);
      setApplyAllTerms(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fee type.");
    } finally {
      setLoading(false);
    }
  }

  const currencyLabel = nationalityGroup ? getCurrency(nationalityGroup) : "GHS";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-5">Create New Fee Type</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

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
            setTerm("");
            setApplyAllClasses(false);
            setApplyAllCampuses(false);
            setApplyAllStudyModes(false);
            setApplyAllStudentTypes(false);
            setApplyAllTerms(false);
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

        {!isVsec && schoolType && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Student Type</label>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyAllStudentTypes}
                  onChange={(e) => {
                    setApplyAllStudentTypes(e.target.checked);
                    setStudentType("");
                  }}
                  disabled={loading}
                  style={{ accentColor: "var(--color-primary)" }}
                  className="w-3.5 h-3.5 rounded"
                />
                Apply to all student types
              </label>
            </div>
            <Select
              value={studentType}
              onChange={(e) => setStudentType(e.target.value as StudentType)}
              placeholder="Select student type"
              disabled={loading || applyAllStudentTypes}
            >
              {STUDENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
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
                disabled={!schoolType || loading}
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
            disabled={!schoolType || loading || applyAllTerms}
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
          <label className="text-sm font-medium text-slate-700">
            Amount ({currencyLabel})
          </label>
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

        <div className="flex items-end">
          <Button type="submit" loading={loading} className="w-full">
            Create Fee Type
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
          Fee type created successfully!
        </p>
      )}
    </form>
  );
}
