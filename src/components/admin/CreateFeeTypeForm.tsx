import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import {
  SCHOOL_TYPES,
  CLASS_LEVELS,
  TERMS,
  VSEC_SCHOOL,
  VSEC_CAMPUSES,
  VSEC_STUDY_MODES,
  ALL_CLASSES_LABEL,
  ALL_CAMPUSES_LABEL,
  ALL_STUDY_MODES_LABEL,
  type SchoolType,
  type Term,
} from "../../lib/constants";
import Select from "../ui/Select";
import Button from "../ui/Button";

export default function CreateFeeTypeForm() {
  const [feeName, setFeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [schoolType, setSchoolType] = useState<SchoolType | "">("");
  const [campus, setCampus] = useState("");
  const [studyMode, setStudyMode] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [term, setTerm] = useState<Term | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isVsec = schoolType === VSEC_SCHOOL;

  const classOptions = useMemo(() => {
    if (!schoolType) return [];
    return [ALL_CLASSES_LABEL, ...CLASS_LEVELS[schoolType]];
  }, [schoolType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!feeName.trim() || !amount || !schoolType || !classLevel || !term) {
      setError("All fields are required.");
      return;
    }
    if (isVsec && (!campus || !studyMode)) {
      setError("Campus and Study Mode are required for VSEC College of Studies.");
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
          classLevel,
          allClasses: classLevel === ALL_CLASSES_LABEL,
          ...(isVsec
            ? {
                campus,
                studyMode,
                allCampuses: campus === ALL_CAMPUSES_LABEL,
                allStudyModes: studyMode === ALL_STUDY_MODES_LABEL,
              }
            : {
                campus: "",
                studyMode: "",
                allCampuses: false,
                allStudyModes: false,
              }),
          term,
          createdAt: Date.now(),
        })
      );
      setFeeName("");
      setAmount("");
      setSchoolType("");
      setCampus("");
      setStudyMode("");
      setClassLevel("");
      setTerm("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fee type.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Create New Fee Type</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <Select
          label="School Type"
          value={schoolType}
          onChange={(e) => {
            setSchoolType(e.target.value as SchoolType);
            setClassLevel("");
            setCampus("");
            setStudyMode("");
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
              onChange={(e) => setCampus(e.target.value)}
              placeholder="Select campus"
              disabled={loading}
            >
              <option value={ALL_CAMPUSES_LABEL}>{ALL_CAMPUSES_LABEL}</option>
              {VSEC_CAMPUSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>

            <Select
              label="Study Mode"
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value)}
              placeholder="Select study mode"
              disabled={loading}
            >
              <option value={ALL_STUDY_MODES_LABEL}>{ALL_STUDY_MODES_LABEL}</option>
              {VSEC_STUDY_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
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

        <Select
          label="Term"
          value={term}
          onChange={(e) => setTerm(e.target.value as Term)}
          placeholder="Select term"
          disabled={loading}
        >
          {TERMS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Fee Name</label>
          <input
            type="text"
            value={feeName}
            onChange={(e) => setFeeName(e.target.value)}
            placeholder="e.g. Total Admission Fee"
            disabled={loading}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Amount (GHS)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500.00"
            disabled={loading}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <Button type="submit" loading={loading} className="w-full">
            Create Fee Type
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Fee type created successfully!
        </p>
      )}
    </form>
  );
}
