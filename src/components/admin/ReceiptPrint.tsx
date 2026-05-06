import { useEffect, useRef } from "react";
import { formatCurrency, formatDateTime } from "../../lib/utils";

export type ReceiptData = {
  transactionId: string;
  studentName: string;
  studentId: string;
  schoolType: string;
  classLevel: string;
  feeName: string;
  term: string;
  feeAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  paymentDate: number;
};

type Props = {
  data: ReceiptData | null;
  onAfterPrint?: () => void;
};

const PRINT_STYLE_ID = "vsec-print-style";

export function triggerPrint(onAfterPrint?: () => void) {
  // Inject print styles
  if (!document.getElementById(PRINT_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    style.textContent = `
      @media print {
        body > *:not(#vsec-receipt-print) { display: none !important; }
        #vsec-receipt-print { display: block !important; }
      }
    `;
    document.head.appendChild(style);
  }

  window.print();

  if (onAfterPrint) {
    const cleanup = () => {
      document.getElementById(PRINT_STYLE_ID)?.remove();
      onAfterPrint();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
  } else {
    window.addEventListener("afterprint", () => {
      document.getElementById(PRINT_STYLE_ID)?.remove();
    }, { once: true });
  }
}

export default function ReceiptPrint({ data, onAfterPrint }: Props) {
  const afterPrintRef = useRef(onAfterPrint);
  afterPrintRef.current = onAfterPrint;

  useEffect(() => {
    return () => {
      document.getElementById(PRINT_STYLE_ID)?.remove();
    };
  }, []);

  if (!data) return null;

  return (
    <div
      id="vsec-receipt-print"
      style={{ display: "none" }}
      className="p-8 max-w-md mx-auto font-mono text-sm"
    >
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-xl font-bold">VSEC SCHOOL</h1>
        <p className="text-xs mt-1">Payment Receipt</p>
      </div>

      {/* Receipt details */}
      <div className="space-y-1.5 mb-4">
        <Row label="Receipt No." value={data.transactionId} />
        <Row label="Date" value={formatDateTime(data.paymentDate)} />
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      <div className="space-y-1.5 mb-4">
        <Row label="Student Name" value={data.studentName} />
        <Row label="Student ID" value={data.studentId} />
        <Row label="School Type" value={data.schoolType} />
        <Row label="Class" value={data.classLevel} />
      </div>

      <div className="border-t border-dashed border-gray-400 my-3" />

      <div className="space-y-1.5 mb-4">
        <Row label="Fee Name" value={data.feeName} />
        <Row label="Term" value={`${data.term} Term`} />
        <Row label="Total Fee" value={formatCurrency(data.feeAmount)} />
        <Row label="Amount Paid" value={formatCurrency(data.amountPaid)} />
        <Row label="Balance" value={formatCurrency(data.balance)} />
        <Row label="Payment Method" value={data.paymentMethod} />
      </div>

      <div className="border-t-2 border-gray-800 mt-4 pt-4 text-center">
        <p className="text-xs text-gray-600">
          Thank you for your payment!
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Keep this receipt for your records.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-600 shrink-0">{label}:</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
