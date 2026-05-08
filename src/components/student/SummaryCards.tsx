import { formatCurrency } from "../../lib/utils";

type Props = {
  totalDue: number;
  totalPaid: number;
  balance: number;
  currency?: "GHS" | "USD";
};

export default function SummaryCards({ totalDue, totalPaid, balance, currency = "GHS" }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Fees Due</p>
        <p className="text-2xl font-bold text-blue-800 mt-1">{formatCurrency(totalDue, currency)}</p>
      </div>
      <div className="bg-green-50 rounded-xl p-4">
        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Amount Paid</p>
        <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(totalPaid, currency)}</p>
      </div>
      <div className={`rounded-xl p-4 ${balance > 0 ? "bg-red-50" : "bg-gray-50"}`}>
        <p className={`text-xs font-medium uppercase tracking-wide ${balance > 0 ? "text-red-600" : "text-gray-500"}`}>
          Balance
        </p>
        <p className={`text-2xl font-bold mt-1 ${balance > 0 ? "text-red-800" : "text-gray-600"}`}>
          {formatCurrency(balance, currency)}
        </p>
      </div>
    </div>
  );
}
