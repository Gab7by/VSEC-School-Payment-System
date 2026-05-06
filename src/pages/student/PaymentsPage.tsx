import MakePaymentForm from "../../components/student/MakePaymentForm";

export default function StudentPaymentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Make a Payment</h2>
        <p className="text-sm text-gray-500">Select the term and fee to pay for</p>
      </div>
      <MakePaymentForm />
    </div>
  );
}
