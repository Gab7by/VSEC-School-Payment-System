import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import { generateTransactionId, formatCurrency } from "../../lib/utils";
import { TERMS, PAYMENT_METHODS, VSEC_SCHOOL, getCurrency, type Term, type PaymentMethod } from "../../lib/constants";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import PaymentSuccessModal from "../admin/PaymentSuccessModal";
import type { ReceiptData } from "../admin/ReceiptPrint";

type FeeType = {
  id: string;
  feeName?: string;
  amount?: number;
  schoolType?: string;
  classLevel?: string;
  allClasses?: boolean;
  campus?: string;
  studyMode?: string;
  allCampuses?: boolean;
  allStudyModes?: boolean;
  nationalityGroup?: string;
  term?: string;
};

function StepHeader({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: "var(--color-secondary)", color: "var(--color-primary-dark)" }}
      >
        {num}
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  );
}

export default function MakePaymentForm() {
  const { session } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<Term | "">("");
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const { data } = db.useQuery({
    students: {
      $: { where: { id: session?.id ?? "" } },
      payments: { feeType: {} },
    },
    feeTypes: {},
  });

  const student = data?.students?.[0];
  const allFeeTypes = (data?.feeTypes ?? []) as FeeType[];
  const currency = getCurrency(student?.nationalityGroup);

  const matchingFeeTypes = useMemo(() => {
    if (!selectedTerm || !student) return [];
    return allFeeTypes.filter((ft) => {
      if (ft.term !== selectedTerm) return false;
      if (ft.schoolType !== student.schoolType) return false;
      if (!ft.allClasses && ft.classLevel !== student.classLevel) return false;
      if (student.schoolType === VSEC_SCHOOL) {
        if (!ft.allCampuses && ft.campus !== student.campus) return false;
        if (!ft.allStudyModes && ft.studyMode !== student.studyMode) return false;
        if (ft.nationalityGroup !== student.nationalityGroup) return false;
      }
      return true;
    });
  }, [selectedTerm, allFeeTypes, student]);

  const selectedFeeType = matchingFeeTypes.find((ft) => ft.id === selectedFeeTypeId);

  const paidForSelectedFee = useMemo(() => {
    if (!selectedFeeType || !student) return 0;
    return (student.payments ?? [])
      .filter((p) => {
        const ft = p.feeType as { id?: string } | undefined;
        return ft?.id === selectedFeeType.id;
      })
      .reduce((sum: number, p) => sum + (p.amountPaid ?? 0), 0);
  }, [selectedFeeType, student]);

  const remainingBalance = selectedFeeType
    ? Math.max(0, (selectedFeeType.amount ?? 0) - paidForSelectedFee)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedTerm || !selectedFeeTypeId || !amountToPay || !paymentMethod) {
      setError("Please complete all fields.");
      return;
    }
    if (!selectedFeeType || !session || !student) return;

    const amount = parseFloat(amountToPay);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amount > remainingBalance) {
      setError(`Amount cannot exceed the remaining balance of ${formatCurrency(remainingBalance, currency)}.`);
      return;
    }
    if (remainingBalance <= 0) {
      setError("This fee is already fully paid.");
      return;
    }

    setLoading(true);
    try {
      const transactionId = generateTransactionId();
      const now = Date.now();
      const newBalance = Math.max(0, remainingBalance - amount);
      const newPaymentId = id();

      await db.transact([
        db.tx.payments[newPaymentId]
          .update({
            transactionId,
            amountPaid: amount,
            balance: newBalance,
            paymentMethod,
            paymentDate: now,
            term: selectedTerm,
            feeName: selectedFeeType.feeName ?? "",
            feeAmount: selectedFeeType.amount ?? 0,
            currency,
            createdAt: now,
          })
          .link({ feeType: selectedFeeType.id }),
        db.tx.students[session.id].link({ payments: newPaymentId }),
      ]);

      setReceiptData({
        transactionId,
        studentName: student.fullName ?? session.name,
        studentId: student.studentId ?? session.studentId ?? "",
        schoolType: student.schoolType ?? session.schoolType ?? "",
        classLevel: student.classLevel ?? session.classLevel ?? "",
        feeName: selectedFeeType.feeName ?? "",
        term: selectedTerm,
        feeAmount: selectedFeeType.amount ?? 0,
        amountPaid: amount,
        balance: newBalance,
        paymentMethod,
        paymentDate: now,
        currency,
      });

      setSelectedTerm("");
      setSelectedFeeTypeId("");
      setAmountToPay("");
      setPaymentMethod("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Step 1: Term */}
        <div>
          <StepHeader num={1} label="Select Term" />
          <div className="grid grid-cols-3 gap-3">
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTerm(t);
                  setSelectedFeeTypeId("");
                }}
                className="py-3 rounded-xl border text-sm font-semibold transition-all"
                style={
                  selectedTerm === t
                    ? { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "white", boxShadow: "0 2px 8px rgba(11,61,145,0.3)" }
                    : { background: "white", borderColor: "#cbd5e1", color: "#475569" }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Fee selection */}
        {selectedTerm && (
          <div>
            <StepHeader num={2} label="Select Fee" />
            {matchingFeeTypes.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3">
                No fee types available for {selectedTerm}.
              </p>
            ) : (
              <div className="space-y-2.5">
                {matchingFeeTypes.map((ft) => {
                  const paid = (student?.payments ?? [])
                    .filter((p) => {
                      const pFt = p.feeType as { id?: string } | undefined;
                      return pFt?.id === ft.id;
                    })
                    .reduce((sum: number, p) => sum + (p.amountPaid ?? 0), 0);
                  const bal = Math.max(0, (ft.amount ?? 0) - paid);
                  const isSelected = selectedFeeTypeId === ft.id;

                  return (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => setSelectedFeeTypeId(ft.id)}
                      disabled={bal <= 0}
                      className="w-full text-left flex items-center justify-between rounded-xl border-2 px-4 py-3.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={
                        isSelected
                          ? { borderColor: "var(--color-primary)", background: "rgba(11,61,145,0.04)" }
                          : { borderColor: "#e2e8f0", background: "white" }
                      }
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{ft.feeName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {bal <= 0 ? "Fully paid" : `Balance: ${formatCurrency(bal, currency)}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {formatCurrency(ft.amount ?? 0, currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Steps 3 & 4: Amount + Method */}
        {selectedFeeTypeId && remainingBalance > 0 && (
          <>
            {/* Remaining balance box */}
            <div
              className="rounded-xl px-4 py-3 border"
              style={{ background: "rgba(11,61,145,0.04)", borderColor: "rgba(11,61,145,0.18)" }}
            >
              <p className="text-xs font-medium" style={{ color: "rgba(11,61,145,0.7)" }}>Remaining Balance</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: "var(--color-primary)" }}>
                {formatCurrency(remainingBalance, currency)}
              </p>
            </div>

            <div>
              <StepHeader num={3} label="Amount to Pay" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                  {currency === "USD" ? "$" : "GHS"}
                </span>
                <input
                  type="number"
                  min="0.01"
                  max={remainingBalance}
                  step="0.01"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400"
                  style={{
                    paddingLeft: currency === "USD" ? "2.5rem" : "3.5rem",
                    "--tw-ring-color": "var(--color-primary)",
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div>
              <StepHeader num={4} label="Payment Method" />
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className="py-4 rounded-xl border-2 text-sm font-semibold flex flex-col items-center gap-2 transition-all"
                    style={
                      paymentMethod === method
                        ? { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "white", boxShadow: "0 4px 12px rgba(11,61,145,0.3)" }
                        : { background: "white", borderColor: "#e2e8f0", color: "#475569" }
                    }
                  >
                    {method === "Mobile Money" ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    )}
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        {selectedFeeTypeId && remainingBalance > 0 && (
          <Button
            type="submit"
            loading={loading}
            className="w-full py-3.5 text-base font-semibold rounded-xl"
          >
            Confirm Payment
          </Button>
        )}
      </form>

      {receiptData && (
        <PaymentSuccessModal
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </>
  );
}
