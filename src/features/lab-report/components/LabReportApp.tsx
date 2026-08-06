"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useLabReport } from "@/hooks/useLabReport";
import { FileUploader } from "./FileUploader";
import { ReportOutput } from "./ReportOutput";
import { SkeletonCard } from "./SkeletonCard";
import type { ExplanationMode } from "@/types/lab-report";

const MODES: { value: ExplanationMode; label: string; hint: string }[] = [
  { value: "plain", label: "Plain English", hint: "For everyone" },
  { value: "eli5", label: "ELI 12", hint: "No jargon at all" },
  { value: "clinical", label: "Clinical", hint: "Med student level" },
];

const stepVariants: Variants = {
  enter: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
};

function DarkModeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
}

function ModeSelector({
  mode,
  setMode,
}: {
  mode: ExplanationMode;
  setMode: (m: ExplanationMode) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Explanation style
      </span>
      <div className="inline-flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            title={m.hint}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m.value
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LabReportApp() {
  const { state, explain, reset, cancel, isBusy } = useLabReport();
  const [mode, setMode] = useState<ExplanationMode>("plain");
  const [isDark, setIsDark] = useState(false);

  // Sync from the anti-FOUC script that runs before hydration
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }, [isDark]);

  const step =
    state.status === "loading" || state.status === "streaming"
      ? "analyzing"
      : state.status === "success"
      ? "results"
      : "upload";

  const modeLabel = MODES.find(m => m.value === mode)?.label ?? "Plain English";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-none">
              Lab Report Explainer
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              AI-powered plain-language analysis
            </p>
          </div>
          <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
        </div>
      </header>

      {/* ── Step content ────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {/* Step 1 — Upload */}
          {step === "upload" && (
            <motion.div
              key="upload"
              variants={stepVariants}
              initial="enter"
              animate="visible"
              exit="exit"
            >
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Understand your lab results
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Upload a PDF, take a photo, or paste the text — we&apos;ll explain every value in plain language.
                  </p>
                </div>

                {state.status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm"
                  >
                    <strong>Error: </strong>{state.message}
                  </motion.div>
                )}

                <ModeSelector mode={mode} setMode={setMode} />
                <FileUploader onExplain={explain} mode={mode} busy={isBusy} />
              </div>
            </motion.div>
          )}

          {/* Step 2 — Analyzing */}
          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              variants={stepVariants}
              initial="enter"
              animate="visible"
              exit="exit"
            >
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                      Analyzing your report
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Using{" "}
                      <span className="font-medium text-sky-600 dark:text-sky-400">
                        {modeLabel}
                      </span>{" "}
                      mode
                      {state.status === "streaming" && (
                        <span className="ml-1 text-gray-400 dark:text-gray-600">
                          · {state.bytesReceived} chars
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={cancel}
                    className="shrink-0 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors mt-1"
                  >
                    Cancel
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                  <motion.div
                    className="bg-sky-500 h-1 rounded-full"
                    initial={{ width: "5%" }}
                    animate={{
                      width:
                        state.status === "streaming"
                          ? `${Math.min(95, (state.bytesReceived / 2000) * 100)}%`
                          : "25%",
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Skeleton cards */}
                <div className="space-y-3">
                  {[0, 1, 2].map(i => (
                    <SkeletonCard key={i} delay={i * 0.12} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Results */}
          {step === "results" && state.status === "success" && (
            <motion.div
              key="results"
              variants={stepVariants}
              initial="enter"
              animate="visible"
              exit="exit"
            >
              <ReportOutput state={state} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
