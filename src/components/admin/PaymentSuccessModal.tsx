import Modal from "../ui/Modal";
import Button from "../ui/Button";
import ReceiptPrint, { triggerPrint, type ReceiptData } from "./ReceiptPrint";
import { formatCurrency, formatDateTime } from "../../lib/utils";

type Props = {
  data: ReceiptData;
  onClose: () => void;
};

export default function PaymentSuccessModal({ data, onClose }: Props) {
  function handleDownload() {
    triggerPrint();
  }

  return (
    <>
      <ReceiptPrint data={data} />
      <Modal title="Payment Successful" onClose={onClose} maxWidth="max-w-md">
        {/* Success icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Confirmed</h3>
          <p className="text-sm text-gray-500 mt-1">Your payment has been recorded successfully.</p>
        </div>

        {/* Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm mb-5">
          <DetailRow label="Amount Paid" value={formatCurrency(data.amountPaid)} highlight />
          <DetailRow label="Balance" value={formatCurrency(data.balance)} />
          <DetailRow label="Fee Name" value={data.feeName} />
          <DetailRow label="Term" value={`${data.term} Term`} />
          <DetailRow label="Payment Method" value={data.paymentMethod} />
          <DetailRow label="Transaction ID" value={data.transactionId} mono />
          <DetailRow label="Date & Time" value={formatDateTime(data.paymentDate)} />
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17H17.01M17 3H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2V5a2 2 0 00-2-2z" />
            </svg>
            Download Receipt
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
}

function DetailRow({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-right font-medium ${highlight ? "text-green-700 text-base font-bold" : "text-gray-800"} ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
