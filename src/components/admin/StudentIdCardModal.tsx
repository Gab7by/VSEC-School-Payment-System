import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { db } from "../../lib/db";
import type { Student } from "../../lib/types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import StudentIdCard from "./StudentIdCard";
import ChangeClassModal from "./ChangeClassModal";

type Props = {
  student: Student;
  onClose: () => void;
};

export default function StudentIdCardModal({ student, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const { data } = db.useQuery({
    students: { $: { where: { id: student.id } } },
  });
  const liveStudent = data?.students?.[0] ?? student;

  async function handleDownload() {
    if (!cardRef.current) return;
    setError("");
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${liveStudent.studentId}-id-card.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate the ID card image.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Modal title="Student ID Card" onClose={onClose} maxWidth="max-w-3xl">
        <div className="flex flex-col items-center gap-5">
          <div className="overflow-x-auto max-w-full">
            <StudentIdCard ref={cardRef} student={liveStudent as Student} />
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
            <Button onClick={handleDownload} loading={downloading} className="flex-1">
              Download JPG
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
