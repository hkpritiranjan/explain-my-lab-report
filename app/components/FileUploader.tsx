"use client";
import React, { useState } from "react";
import Tesseract from "tesseract.js";

export default function FileUploader({ onSendText }:any) {
  const [manual, setManual] = useState("");
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manual.trim().length) await onSendText(manual);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/explain", { method: "POST", body: fd });
      const json = await res.json();
      onSendText(json.explanation ?? JSON.stringify(json));
    } else if (file.type.startsWith("image/")) {
      setOcrProgress(0);
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: m => {
          if (m.status === "recognizing text" && m.progress) {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      setOcrProgress(null);
      await onSendText(data.text);
    } else {
      alert("Unsupported file type. Use PDF or image.");
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">User Input</h3>

      <form onSubmit={handleManualSubmit} className="mb-4">
        <textarea
          value={manual}
          onChange={e => setManual(e.target.value)}
          rows={6}
          placeholder="Paste or type your lab report text here…"
          className="w-full rounded-md border border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-gray-800 p-3 text-sm resize-none outline-none"
        />
        <button
          type="submit"
          className="mt-3 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Submit
        </button>
      </form>

      <div className="border-t border-gray-200 my-4"></div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload PDF or image:
        </label>
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-medium
                     file:bg-sky-600 file:text-white
                     hover:file:bg-sky-700
                     cursor-pointer"
        />
        {ocrProgress !== null && (
          <div className="text-sky-600 text-sm mt-2">OCR progress: {ocrProgress}%</div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Tip: For images, we extract text in your browser. For PDFs we parse on the server.
      </p>
    </div>
  );
}
