import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../../lib/db";
import { id } from "@instantdb/react";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../lib/utils";
import { normalizeGhanaPhone, parsePhoneListBlob, calculateSmsUnits } from "../../lib/sms";
import type { Student } from "../../lib/types";

type SendMode = "all" | "selected" | "external";
type Recipient = { id: string; name: string; phone: string };
type ResultBanner = { type: "success" | "partial" | "error"; text: string };

const inputCls =
  "w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ring-offset-1 transition-shadow placeholder:text-slate-400";

function resolveStudentRecipients(list: Student[]): Recipient[] {
  const result: Recipient[] = [];
  for (const s of list) {
    const phone = normalizeGhanaPhone(s.phone);
    if (phone) result.push({ id: s.id, name: s.fullName, phone });
  }
  return result;
}

function sendTypeLabel(sendType: string): string {
  switch (sendType) {
    case "all-students":
      return "All Students";
    case "individual":
      return "Individual";
    case "external":
      return "External";
    default:
      return "Selected";
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
  };
  const labels: Record<string, string> = { sent: "Sent", partial: "Partial", failed: "Failed" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default function BulkSmsPage() {
  const { session } = useAuth();
  const location = useLocation();

  const [mode, setMode] = useState<SendMode>("all");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [externalBlob, setExternalBlob] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [resultBanner, setResultBanner] = useState<ResultBanner | null>(null);
  const [historySearch, setHistorySearch] = useState("");

  const { data, isLoading } = db.useQuery({
    students: { $: { order: { createdAt: "desc" } } },
  });
  const students = data?.students ?? [];

  const { data: historyData } = db.useQuery({
    smsLogs: { $: { order: { sentAt: "desc" } } },
  });
  const logs = historyData?.smsLogs ?? [];

  useEffect(() => {
    const presetId = (location.state as { presetStudentId?: string } | null)?.presetStudentId;
    if (presetId) {
      setMode("selected");
      setSelectedIds(new Set([presetId]));
    }
  }, [location.state]);

  const filteredStudents = search.trim()
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(search.toLowerCase()) ||
          s.studentId.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  const allVisibleSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id));

  function toggleStudent(studentId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredStudents.forEach((s) => next.delete(s.id));
      } else {
        filteredStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  const externalParsed = useMemo(() => parsePhoneListBlob(externalBlob), [externalBlob]);
  const unitInfo = useMemo(() => calculateSmsUnits(message), [message]);

  const recipientPreview: Recipient[] = useMemo(() => {
    if (mode === "all") return resolveStudentRecipients(students);
    if (mode === "selected")
      return resolveStudentRecipients(students.filter((s) => selectedIds.has(s.id)));
    return externalParsed.valid.map((phone) => ({ id: phone, name: phone, phone }));
  }, [mode, students, selectedIds, externalParsed]);

  const recipientPhones = useMemo(
    () => Array.from(new Set(recipientPreview.map((r) => r.phone))),
    [recipientPreview]
  );

  function resolveSendType(): string {
    if (mode === "all") return "all-students";
    if (mode === "external") return "external";
    return recipientPreview.length === 1 ? "individual" : "selected-students";
  }

  function openConfirm() {
    setSendError("");
    setResultBanner(null);
    if (!message.trim()) {
      setSendError("Message cannot be empty.");
      return;
    }
    if (recipientPhones.length === 0) {
      setSendError("No valid recipients to send to.");
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmSend() {
    setSending(true);
    setSendError("");
    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), recipients: recipientPhones }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error ?? "Failed to send SMS.");
      }

      await db.transact(
        db.tx.smsLogs[id()].update({
          message: message.trim(),
          recipients: recipientPhones,
          recipientCount: result.recipientCount,
          sendType: resolveSendType(),
          status: result.status,
          sentAt: Date.now(),
          sentByAdminId: session?.id ?? "",
          sentByAdminName: session?.name ?? "",
          arkeselMessageIds: result.messageIds ?? [],
          creditsUsed: result.creditsUsed ?? 0,
          ...(result.errors?.length ? { errorMessage: result.errors.join("; ") } : {}),
        })
      );

      setResultBanner({
        type: result.status === "sent" ? "success" : result.status === "partial" ? "partial" : "error",
        text:
          result.status === "sent"
            ? `Message sent to ${result.sentCount} recipient(s).`
            : result.status === "partial"
            ? `Sent to ${result.sentCount} of ${result.recipientCount} recipient(s). ${result.failedCount} failed.`
            : `Failed to send: ${result.errors?.join("; ") ?? "Unknown error."}`,
      });

      if (result.status === "sent") {
        setMessage("");
        setSelectedIds(new Set());
        setExternalBlob("");
        setMode("all");
      }
      setShowConfirm(false);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send SMS.");
    } finally {
      setSending(false);
    }
  }

  const filteredLogs = historySearch.trim()
    ? logs.filter(
        (l) =>
          l.message.toLowerCase().includes(historySearch.toLowerCase()) ||
          l.sentByAdminName.toLowerCase().includes(historySearch.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Bulk SMS</h2>
        <p className="text-sm text-slate-500">Send SMS messages to students via Arkesel.</p>
      </div>

      {/* Composer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
        {/* Mode selector */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          {(["all", "selected", "external"] as SendMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? "text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
              style={mode === m ? { background: "var(--color-primary)" } : {}}
            >
              {m === "all" ? "All Students" : m === "selected" ? "Select Students" : "External Numbers"}
            </button>
          ))}
        </div>

        {mode === "all" && (
          <p className="text-sm text-slate-600">
            This will send to all <strong>{students.length}</strong> student{students.length !== 1 ? "s" : ""}.
          </p>
        )}

        {mode === "selected" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or student ID…"
                  className={`${inputCls} pl-10`}
                  style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
                />
              </div>
              <span className="text-sm text-slate-500 whitespace-nowrap">{selectedIds.size} selected</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No students match your search.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 sticky top-0">
                      <th className="px-4 py-2.5 w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          style={{ accentColor: "var(--color-primary)" }}
                          className="w-4 h-4 rounded"
                        />
                      </th>
                      <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                      <th className="text-left px-2 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleStudent(s.id)}>
                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleStudent(s.id)}
                            style={{ accentColor: "var(--color-primary)" }}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="px-2 py-2.5 font-medium text-slate-900">{s.fullName}</td>
                        <td className="px-2 py-2.5 font-mono text-xs text-slate-500">{s.studentId}</td>
                        <td className="px-2 py-2.5 text-slate-500">{s.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {mode === "external" && (
          <div className="space-y-1.5">
            <textarea
              value={externalBlob}
              onChange={(e) => setExternalBlob(e.target.value)}
              rows={4}
              placeholder="e.g. 0244123456, 0551234567 (comma, space, or newline separated)"
              className={inputCls}
              style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
            />
            {externalBlob.trim() && (
              <div className="text-xs space-y-1">
                <p className="text-emerald-700">
                  {externalParsed.valid.length} valid number{externalParsed.valid.length !== 1 ? "s" : ""}
                </p>
                {externalParsed.invalid.length > 0 && (
                  <p className="text-amber-600">
                    {externalParsed.invalid.length} entr{externalParsed.invalid.length !== 1 ? "ies" : "y"} could not be recognized: {externalParsed.invalid.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message composer */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Type your message…"
            className={inputCls}
            style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
          />
          <p className={`text-xs mt-1.5 ${unitInfo.segments > 1 ? "text-amber-600" : "text-slate-400"}`}>
            {unitInfo.length} character{unitInfo.length !== 1 ? "s" : ""} · {unitInfo.encoding} · {unitInfo.segments || 0} segment
            {unitInfo.segments !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Summary + send */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Ready to send to <strong className="text-slate-900">{recipientPhones.length}</strong> recipient
            {recipientPhones.length !== 1 ? "s" : ""}
            {mode === "all" && students.length > recipientPhones.length && (
              <span className="text-amber-600">
                {" "}
                ({students.length - recipientPhones.length} student{students.length - recipientPhones.length !== 1 ? "s" : ""} skipped
                for an invalid phone number)
              </span>
            )}
          </p>
          <button
            onClick={openConfirm}
            disabled={sending || !message.trim() || recipientPhones.length === 0}
            className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
            style={{ background: "var(--color-primary)", boxShadow: "0 4px 12px rgba(11,61,145,0.3)" }}
          >
            Send SMS
          </button>
        </div>

        {resultBanner && (
          <p
            className={`text-sm rounded-xl px-4 py-2.5 border ${
              resultBanner.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : resultBanner.type === "partial"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            {resultBanner.text}
          </p>
        )}
        {sendError && !showConfirm && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">{sendError}</p>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Message History</h3>
            <p className="text-sm text-slate-500">
              {logs.length} message{logs.length !== 1 ? "s" : ""} sent
            </p>
          </div>
          <div className="relative sm:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search by message or admin…"
              className={`${inputCls} pl-10`}
              style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            {historySearch ? "No messages match your search." : "No messages sent yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Recipients</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sent By</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(log.sentAt)}</td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {log.recipientCount}{" "}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 ml-1">
                        {sendTypeLabel(log.sendType)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                      {log.errorMessage && (
                        <p className="text-xs text-rose-500 mt-1 max-w-xs truncate" title={log.errorMessage}>
                          {log.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{log.sentByAdminName}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">{log.creditsUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 backdrop-blur-sm"
            style={{ background: "rgba(15,23,42,0.6)" }}
            onClick={() => !sending && setShowConfirm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(11,61,145,0.1)" }}>
                <svg className="w-5 h-5" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Send SMS?</h3>
                <p className="text-sm text-slate-500 mt-0.5">This will send immediately and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-2">
              <p>
                Sending to <strong>{recipientPhones.length}</strong> recipient{recipientPhones.length !== 1 ? "s" : ""} (
                {unitInfo.segments} segment{unitInfo.segments !== 1 ? "s" : ""} × {recipientPhones.length} ≈{" "}
                {unitInfo.segments * recipientPhones.length} units)
              </p>
              <p className="text-xs text-slate-500 truncate">
                {recipientPreview.slice(0, 3).map((r) => r.name).join(", ")}
                {recipientPreview.length > 3 ? ` and ${recipientPreview.length - 3} more…` : ""}
              </p>
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 whitespace-pre-wrap">
                {message}
              </div>
            </div>

            {sendError && <p className="text-sm text-rose-600">{sendError}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => !sending && setShowConfirm(false)}
                disabled={sending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={sending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}
              >
                {sending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : (
                  "Send Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
