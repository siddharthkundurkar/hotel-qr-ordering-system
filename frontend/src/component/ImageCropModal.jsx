import Cropper from "react-easy-crop";
import { useState } from "react";
import { getCroppedImage } from "../utils/cropImage";

export default function ImageCropModal({
  image,
  onCancel,
  onCropDone,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  const onCropComplete = (_, pixels) => {
    setCroppedPixels(pixels);
  };

  const finishCrop = async () => {
    const croppedFile = await getCroppedImage(
      image,
      croppedPixels,
      512,
      512
    );
    onCropDone(croppedFile);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="bg-white p-4 flex justify-between items-center">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
        />

        <div className="flex gap-3">
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={finishCrop}
            className="bg-black text-white px-4 py-1 rounded"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}
