"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
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
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState<"file" | "text">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = busy || fileState.status === "processing";

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = manual.trim();
    if (text.length < 10) return;
    await onExplain(text, mode);
  }

  async function processFile(file: File) {
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

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 text-sm">
        <button
          onClick={() => setTab("file")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            tab === "file"
              ? "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <CloudArrowUpIcon className="w-4 h-4" />
          Upload file
        </button>
        <button
          onClick={() => setTab("text")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            tab === "text"
              ? "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <DocumentTextIcon className="w-4 h-4" />
          Paste text
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Upload tab ────────────────────────────────────── */}
        {tab === "file" && (
          <motion.div
            key="file-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileInputChange}
              disabled={isDisabled}
              className="sr-only"
              aria-label="Upload lab report file"
            />

            {/* Drag-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); if (!isDisabled) setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={isDisabled ? undefined : handleDrop}
              onClick={() => !isDisabled && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && !isDisabled && fileInputRef.current?.click()}
              aria-label="Drop zone for lab report file"
              className={`
                relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
                transition-all duration-200 select-none
                ${isDragging
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-600 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className={`p-3 rounded-xl transition-colors ${
                  isDragging
                    ? "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                }`}>
                  {isDragging ? (
                    <CloudArrowUpIcon className="w-7 h-7" />
                  ) : (
                    <div className="flex gap-2">
                      <DocumentTextIcon className="w-7 h-7" />
                      <PhotoIcon className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isDragging ? "Drop to upload" : "Drop your file here"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    PDF or image · max 10 MB · PDFs parsed server-side · images via browser OCR
                  </p>
                </div>
                {!isDragging && (
                  <span className="text-xs font-medium text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg px-3 py-1">
                    or click to browse
                  </span>
                )}
              </div>
            </div>

            {/* File processing status */}
            <AnimatePresence>
              {fileState.status === "processing" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="status"
                  aria-live="polite"
                  className="text-sm text-sky-600 dark:text-sky-400 mt-3 animate-pulse"
                >
                  {fileState.message}
                </motion.p>
              )}
              {fileState.status === "error" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  role="alert"
                  className="text-sm text-red-600 dark:text-red-400 mt-3"
                >
                  {fileState.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Paste text tab ────────────────────────────────── */}
        {tab === "text" && (
          <motion.div
            key="text-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <textarea
                value={manual}
                onChange={e => setManual(e.target.value)}
                rows={8}
                placeholder="Paste your lab report text here…"
                disabled={isDisabled}
                className="
                  w-full rounded-2xl border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-900
                  text-gray-900 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-600
                  p-4 text-sm leading-relaxed resize-none outline-none
                  focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Your text is only used for this analysis and is never stored.
                </p>
                <button
                  type="submit"
                  disabled={isDisabled || manual.trim().length < 10}
                  className="
                    bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-white font-medium py-2 px-5 rounded-xl text-sm
                    transition-colors
                  "
                >
                  Analyze
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
