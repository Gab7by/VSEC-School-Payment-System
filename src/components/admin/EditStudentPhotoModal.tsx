import { useState } from "react";
import { db } from "../../lib/db";
import type { StudentWithPhoto } from "../../lib/types";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import PhotoPlaceholder from "../ui/PhotoPlaceholder";
import ImageCropper from "./ImageCropper";

type Props = {
  student: StudentWithPhoto;
  onClose: () => void;
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export default function EditStudentPhotoModal({ student, onClose }: Props) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 8MB.");
      return;
    }
    setCropSrc(URL.createObjectURL(file));
  }

  function handleCropComplete(blob: Blob) {
    setPendingBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    setCropSrc(null);
  }

  async function handleSave() {
    if (!pendingBlob) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await db.storage.uploadFile(
        `students/${student.id}/photo.jpg`,
        pendingBlob
      );
      await db.transact(db.tx.students[student.id].link({ photo: data.id }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the photo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!student.photo) return;
    setError("");
    setLoading(true);
    try {
      await db.transact(
        db.tx.students[student.id].unlink({ photo: student.photo.id })
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove the photo.");
    } finally {
      setLoading(false);
    }
  }

  const displayUrl = previewUrl ?? student.photo?.url;

  return (
    <>
      <Modal title="Edit Photo" onClose={onClose}>
        <div className="space-y-4">
          <div className="mb-1 bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-800">{student.fullName}</p>
            <p className="text-gray-500 text-xs mt-0.5">{student.studentId} — {student.phone}</p>
          </div>

          <div className="flex justify-center">
            <div
              style={{
                width: 108,
                height: 144,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
              }}
            >
              {displayUrl ? (
                <img src={displayUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <PhotoPlaceholder iconSize={40} />
              )}
            </div>
          </div>

          <label className="block">
            <span className="sr-only">Choose photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {student.photo && !pendingBlob && (
              <Button variant="secondary" type="button" onClick={handleRemove} loading={loading} className="flex-1">
                Remove Photo
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSave}
              loading={loading}
              disabled={!pendingBlob}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onCancel={() => setCropSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
