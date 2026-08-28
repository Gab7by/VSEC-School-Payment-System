import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { db } from "../../lib/db";
import type { Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import StudentIdCard from "./StudentIdCard";
import StudentIdCardBack from "./StudentIdCardBack";
import ChangeClassModal from "./ChangeClassModal";

type Props = {
  student: Student;
  onClose: () => void;
};

export default function StudentIdCardModal({ student, onClose }: Props) {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState<"front" | "back" | null>(null);
  const [error, setError] = useState("");

  const { data } = db.useQuery({
    students: { $: { where: { id: student.id } } },
  });
  const liveStudent = data?.students?.[0] ?? student;

  async function handleDownload(side: "front" | "back") {
    const node = side === "front" ? frontRef.current : backRef.current;
    if (!node) return;
    setError("");
    setDownloading(side);
    try {
      const canvas = await html2canvas(node, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${liveStudent.studentId}-id-card-${side}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate the ID card image.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <Modal title="Student ID Card" onClose={onClose} maxWidth="max-w-3xl">
        <div className="flex flex-col items-center gap-6">
          <div className="w-full flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start ml-1">
              Front
            </span>
            <div className="overflow-x-auto max-w-full">
              <StudentIdCard ref={frontRef} student={liveStudent as Student} />
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start ml-1">
              Back
            </span>
            <div className="overflow-x-auto max-w-full">
              <StudentIdCardBack ref={backRef} student={liveStudent as Student} />
            </div>
          </div>

          {error && (
            <p className="w-full text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => setEditing(true)} className="flex-1">
              Edit
            </Button>
            <Button
              onClick={() => handleDownload("front")}
              loading={downloading === "front"}
              disabled={downloading !== null && downloading !== "front"}
              className="flex-1"
            >
              Download Front
            </Button>
            <Button
              onClick={() => handleDownload("back")}
              loading={downloading === "back"}
              disabled={downloading !== null && downloading !== "back"}
              className="flex-1"
            >
              Download Back
            </Button>
          </div>
        </div>
      </Modal>

      {editing && (
        <ChangeClassModal
          student={liveStudent as Student}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
