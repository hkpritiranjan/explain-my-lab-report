"use client";

import React, { useState } from "react";
import Tesseract from "tesseract.js";
import type { ExplanationMode } from "@/types/lab-report";

interface Props {
  onExplain: (text: string, mode: ExplanationMode) => Promise<void>;
  mode: ExplanationMode;
  busy: boolean;
}

type FileState =
  | { status: "idle" }
  | { status: "processing"; message: string }
  | { status: "error"; message: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function FileUploader({ onExplain, mode, busy }: Props) {
  const [manual, setManual] = useState("");
  const [fileState, setFileState] = useState<FileState>({ status: "idle" });

  const isDisabled = busy || fileState.status === "processing";

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = manual.trim();
    if (text.length < 10) return;
    await onExplain(text, mode);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileState({ status: "idle" });

    if (file.size > MAX_FILE_BYTES) {
      setFileState({ status: "error", message: "File is too large. Maximum size is 10 MB." });
      return;
    }

    if (file.type === "application/pdf") {
      setFileState({ status: "processing", message: "Extracting text from PDF…" });
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/extract", { method: "POST", body: fd });
        const json = await res.json() as { text?: string; error?: string };
        if (!res.ok) {
          setFileState({ status: "error", message: json.error ?? "Failed to read PDF." });
          return;
        }
        setFileState({ status: "idle" });
        await onExplain(json.text!, mode);
      } catch {
        setFileState({ status: "error", message: "Could not process PDF. Please try again." });
      }
      return;
    }

    if (file.type.startsWith("image/")) {
      setFileState({ status: "processing", message: "Running OCR (0%)…" });
      try {
        const { data } = await Tesseract.recognize(file, "eng", {
          logger: (m: { status: string; progress?: number }) => {
            if (m.status === "recognizing text") {
              const pct = Math.round((m.progress ?? 0) * 100);
              setFileState({ status: "processing", message: `Running OCR (${pct}%)…` });
            }
          },
        });
        const text = data.text?.trim() ?? "";
        if (text.length < 10) {
          setFileState({
            status: "error",
            message: "Could not extract text from this image. Try a higher-resolution photo.",
          });
          return;
        }
        setFileState({ status: "idle" });
        await onExplain(text, mode);
      } catch {
        setFileState({ status: "error", message: "OCR failed. Please try a different image." });
      }
      return;
    }

    setFileState({
      status: "error",
      message: "Unsupported file type. Please upload a PDF or an image (JPG, PNG, etc.).",
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Upload or Paste Lab Report</h3>
      <p className="text-xs text-gray-400 mb-4">
        Your data is only used to generate the explanation and is not stored.
      </p>

      <form onSubmit={handleManualSubmit} className="mb-4">
        <label htmlFor="lab-text" className="block text-sm font-medium text-gray-700 mb-1">
          Paste report text
        </label>
        <textarea
          id="lab-text"
          value={manual}
          onChange={e => setManual(e.target.value)}
          rows={6}
          placeholder="Paste or type your lab report text here…"
          disabled={isDisabled}
          className="w-full rounded-md border border-gray-300 focus:border-sky-500 focus:ring-sky-500 text-gray-800 p-3 text-sm resize-none outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isDisabled || manual.trim().length < 10}
          className="mt-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {busy ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      <div className="border-t border-gray-200 my-4" />

      <div className="space-y-2">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Upload PDF or image
        </label>
        <input
          id="file-upload"
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          disabled={isDisabled}
          className="block w-full text-sm text-gray-600
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-md file:border-0
                     file:text-sm file:font-medium
                     file:bg-sky-600 file:text-white
                     hover:file:bg-sky-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     cursor-pointer"
        />
        {fileState.status === "processing" && (
          <p role="status" aria-live="polite" className="text-sky-600 text-sm mt-2 animate-pulse">
            {fileState.message}
          </p>
        )}
        {fileState.status === "error" && (
          <p role="alert" className="text-red-600 text-sm mt-2">
            {fileState.message}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        PDFs parsed on the server · Images processed locally via OCR · Max 10 MB
      </p>
    </div>
  );
}
