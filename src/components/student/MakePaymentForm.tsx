import { useState, useMemo } from "react";
import { usePaystackPayment } from "react-paystack";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import { formatCurrency } from "../../lib/utils";
import { TERMS_BY_SCHOOL, getCurrency, type SchoolType, type Term } from "../../lib/constants";
import { feeMatchesStudent } from "../../lib/feeMatching";
import { useAuth } from "../../context/AuthContext";
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
  allTerms?: boolean;
  assignedStudent?: { id: string } | null;
  excludedStudents?: { id: string }[] | null;
};

function StepHeader({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: "var(--color-secondary)", color: "white" }}
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
  const [loading, setLoading] = useState(false);
  const [paystackError, setPaystackError] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const { data } = db.useQuery({
    students: {
      $: { where: { id: session?.id ?? "" } },
      payments: { feeType: {} },
    },
    feeTypes: { assignedStudent: {}, excludedStudents: {} },
  });

  const student = data?.students?.[0];
  const allFeeTypes = (data?.feeTypes ?? []) as FeeType[];
  const currency = getCurrency(student?.nationalityGroup);

  const termOptions = student ? TERMS_BY_SCHOOL[student.schoolType as SchoolType] : [];

  const matchingFeeTypes = useMemo(() => {
    if (!selectedTerm || !student) return [];
    return allFeeTypes.filter((ft) => {
      if (!ft.allTerms && ft.term !== selectedTerm) return false;
      return feeMatchesStudent(ft, student);
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

  const amountNum = parseFloat(amountToPay || "0");

  // Must be called unconditionally at top level (React rules of hooks)
  const initializePayment = usePaystackPayment({
    reference: new Date().getTime().toString(),
    email: `${session?.studentId ?? session?.id ?? "student"}@vseccollege.com`,
    amount: Math.round(amountNum * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string,
    currency: currency === "USD" ? "USD" : "GHS",
    metadata: {
      custom_fields: [],
      studentId: session?.id ?? "",
      feeTypeId: selectedFeeType?.id ?? "",
      term: selectedTerm,
    },
  });

  function handlePayWithPaystack() {
    setPaystackError("");
    if (!selectedFeeType || !session || !student) return;
    const amount = parseFloat(amountToPay);
    if (isNaN(amount) || amount <= 0 || amount > remainingBalance) return;

    initializePayment({
      onSuccess: async (response: { reference: string }) => {
        setLoading(true);
        try {
          const now = Date.now();
          const newBalance = Math.max(0, remainingBalance - amount);
          const newPaymentId = id();

          await db.transact([
            db.tx.payments[newPaymentId]
              .update({
                transactionId: response.reference,
                amountPaid: amount,
                balance: newBalance,
                paymentMethod: "Paystack",
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
            transactionId: response.reference,
            studentName: student.fullName ?? session.name,
            studentId: student.studentId ?? session.studentId ?? "",
            schoolType: student.schoolType ?? session.schoolType ?? "",
            classLevel: student.classLevel ?? session.classLevel ?? "",
            feeName: selectedFeeType.feeName ?? "",
            term: selectedTerm as Term,
            feeAmount: selectedFeeType.amount ?? 0,
            amountPaid: amount,
            balance: newBalance,
            paymentMethod: "Paystack",
            paymentDate: now,
            currency,
          });

          setSelectedTerm("");
          setSelectedFeeTypeId("");
          setAmountToPay("");
        } catch {
          setPaystackError(
            "Your payment was received by Paystack. It may take a moment to reflect here — refresh in a minute, or contact admin if it doesn't appear."
          );
        } finally {
          setLoading(false);
        }
      },
      onClose: () => {
        setPaystackError("Payment was cancelled.");
      },
    });
  }

  return (
    <>
      <div className="space-y-6">

        {/* Step 1: Term */}
        <div>
          <StepHeader num={1} label="Select Term" />
          <div className={`grid gap-3 ${termOptions.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            {termOptions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTerm(t as Term);
                  setSelectedFeeTypeId("");
                }}
                className="py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all"
                style={
                  selectedTerm === t
                    ? { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "white", boxShadow: "0 2px 8px rgba(212,175,55,0.3)" }
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
                          ? { borderColor: "var(--color-primary)", background: "rgba(212,175,55,0.04)" }
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

        {/* Step 3: Amount + Pay button */}
        {selectedFeeTypeId && remainingBalance > 0 && (
          <>
            {/* Remaining balance box */}
            <div
              className="rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 border"
              style={{ background: "rgba(212,175,55,0.06)", borderColor: "rgba(212,175,55,0.25)" }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--color-primary-dark)" }}>Remaining Balance</p>
              <p className="text-lg sm:text-xl font-bold mt-0.5" style={{ color: "var(--color-primary-dark)" }}>
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
                  onChange={(e) => {
                    setAmountToPay(e.target.value);
                    setPaystackError("");
                  }}
                  placeholder="0.00"
                  className="w-full border border-slate-300 rounded-xl py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400"
                  style={{
                    paddingLeft: currency === "USD" ? "2.5rem" : "3.5rem",
                    "--tw-ring-color": "var(--color-primary)",
                  } as React.CSSProperties}
                />
              </div>
            </div>

            {paystackError && (
              <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                {paystackError}
              </p>
            )}

            <button
              type="button"
              onClick={handlePayWithPaystack}
              disabled={loading || !amountToPay || amountNum <= 0 || amountNum > remainingBalance}
              className="w-full py-3 sm:py-3.5 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: "#0BA4DB", boxShadow: "0 4px 14px rgba(11,164,219,0.35)" }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
              {loading ? "Processing…" : "Pay with Paystack →"}
            </button>
          </>
        )}
      </div>

      {receiptData && (
        <PaymentSuccessModal
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </>
  );
}
