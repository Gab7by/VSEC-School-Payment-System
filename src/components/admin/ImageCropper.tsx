import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (blob: Blob) => void;
};

const OUTPUT_WIDTH = 480;
const OUTPUT_HEIGHT = 640;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function ImageCropper({ imageSrc, onCancel, onCropComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  const handleAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setArea(croppedAreaPixels);
  }, []);

  async function handleApply() {
    if (!area) return;
    setError("");
    setApplying(true);
    try {
      const img = await loadImage(imageSrc);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare the image canvas.");
      ctx.drawImage(
        img,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );
      canvas.toBlob(
        (blob) => {
          setApplying(false);
          if (blob) onCropComplete(blob);
          else setError("Failed to process the image. Please try again.");
        },
        "image/jpeg",
        0.9
      );
    } catch {
      setApplying(false);
      setError("Failed to process the image. Please try again.");
    }
  }

  return (
    <Modal title="Crop Photo" onClose={onCancel}>
      <div className="space-y-4">
        <div className="relative w-full bg-slate-900 rounded-xl overflow-hidden" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleAreaChange}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" type="button" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="button" onClick={handleApply} loading={applying} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </Modal>
  );
}
