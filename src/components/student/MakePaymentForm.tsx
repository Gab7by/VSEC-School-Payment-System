import { useState, useMemo } from "react";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import { generateTransactionId, formatCurrency } from "../../lib/utils";
import { TERMS, PAYMENT_METHODS, type Term, type PaymentMethod } from "../../lib/constants";
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
  term?: string;
};

export default function MakePaymentForm() {
  const { session } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<Term | "">("");
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Query student data and all fee types
  const { data } = db.useQuery({
    students: {
      $: { where: { id: session?.id ?? "" } },
      payments: { feeType: {} },
    },
    feeTypes: {},
  });

  const student = data?.students?.[0];
  const allFeeTypes = (data?.feeTypes ?? []) as FeeType[];

  // Filter fee types by student's school/class and selected term
  const matchingFeeTypes = useMemo(() => {
    if (!selectedTerm || !student) return [];
    return allFeeTypes.filter(
      (ft) =>
        ft.term === selectedTerm &&
        ft.schoolType === student.schoolType &&
        (ft.allClasses || ft.classLevel === student.classLevel)
    );
  }, [selectedTerm, allFeeTypes, student]);

  const selectedFeeType = matchingFeeTypes.find(
    (ft) => ft.id === selectedFeeTypeId
  );

  // Compute balance for the selected fee type
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
      setError(`Amount cannot exceed the remaining balance of ${formatCurrency(remainingBalance)}.`);
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
      });

      // Reset form
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Term selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">1. Select Term</h3>
          <div className="grid grid-cols-3 gap-3">
            {TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTerm(t);
                  setSelectedFeeTypeId("");
                }}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  selectedTerm === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {t} Term
              </button>
            ))}
          </div>
        </div>

        {/* Fee selection */}
        {selectedTerm && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">2. Select Fee</h3>
            {matchingFeeTypes.length === 0 ? (
              <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3">
                No fee types available for {selectedTerm} Term.
              </p>
            ) : (
              <div className="space-y-2">
                {matchingFeeTypes.map((ft) => {
                  const paid = (student?.payments ?? [])
                    .filter((p) => {
                      const pFt = p.feeType as { id?: string } | undefined;
                      return pFt?.id === ft.id;
                    })
                    .reduce((sum: number, p) => sum + (p.amountPaid ?? 0), 0);
                  const bal = Math.max(0, (ft.amount ?? 0) - paid);

                  return (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => setSelectedFeeTypeId(ft.id)}
                      disabled={bal <= 0}
                      className={`w-full text-left flex items-center justify-between rounded-lg border px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedFeeTypeId === ft.id
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ft.feeName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {bal <= 0 ? "Fully paid" : `Balance: ${formatCurrency(bal)}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">
                        {formatCurrency(ft.amount ?? 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Amount + method */}
        {selectedFeeTypeId && remainingBalance > 0 && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">Remaining Balance</p>
              <p className="text-xl font-bold text-blue-800 mt-0.5">
                {formatCurrency(remainingBalance)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">3. Amount to Pay</h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  GHS
                </span>
                <input
                  type="number"
                  min="0.01"
                  max={remainingBalance}
                  step="0.01"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">4. Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-lg border text-sm font-medium flex flex-col items-center gap-1.5 transition-colors ${
                      paymentMethod === method
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
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
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {selectedFeeTypeId && remainingBalance > 0 && (
          <Button
            type="submit"
            loading={loading}
            className="w-full py-3 text-base"
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
