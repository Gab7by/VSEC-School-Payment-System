import { useState } from "react";
import { db } from "../../lib/db";
import CreateFeeTypeForm from "../../components/admin/CreateFeeTypeForm";
import { formatCurrency } from "../../lib/utils";

export default function FeesPage() {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = db.useQuery({
    feeTypes: { $: { order: { createdAt: "desc" } } },
  });

  const feeTypes = data?.feeTypes ?? [];

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await db.transact(db.tx.feeTypes[id].delete());
      setConfirmDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Fee Management</h2>
        <p className="text-sm text-gray-500">Create and manage school fee types</p>
      </div>

      <CreateFeeTypeForm />

      {/* Existing fee types table */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Existing Fee Types ({feeTypes.length})
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : feeTypes.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No fee types created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Fee Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">School Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Class</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Term</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {feeTypes.map((ft) => (
                    <tr key={ft.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{ft.feeName}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">
                        {formatCurrency(ft.amount ?? 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ft.schoolType === "Adult School"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-teal-100 text-teal-700"
                        }`}>
                          {ft.schoolType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{ft.classLevel}</td>
                      <td className="px-4 py-3 text-gray-700">{ft.term} Term</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {confirmDeleteId === ft.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button
                              onClick={() => handleDelete(ft.id)}
                              disabled={deleting}
                              className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-2 py-1 rounded transition-colors"
                            >
                              {deleting ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deleting}
                              className="text-xs font-medium text-gray-600 hover:text-gray-800 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(ft.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
