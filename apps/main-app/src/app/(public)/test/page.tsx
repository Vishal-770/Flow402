"use client";

import { useState } from "react";
import { uploadImage } from "@/src/lib/upload";


export default function UploadPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Max file size is 5MB.");
      return;
    }

    setLoading(true);

    try {
      const { url } = await uploadImage(file);
      setImageUrl(url);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Upload failed");
      }
      console.error("Upload failed:", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Upload Image
        </h1>

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition">
          <span className="text-gray-600 mb-2">
            Click to select image
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </label>

        {loading && (
          <div className="mt-4 text-center text-blue-500 font-medium">
            Uploading...
          </div>
        )}

        {imageUrl && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2 text-center">
              Uploaded Image
            </p>

            <img
              src={imageUrl}
              alt="Uploaded"
              className="rounded-lg shadow-md w-full object-cover"
            />

            <p className="text-xs text-gray-500 mt-2 break-all">
              {imageUrl}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
