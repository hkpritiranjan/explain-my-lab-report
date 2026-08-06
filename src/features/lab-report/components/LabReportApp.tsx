"use client";

import React, { useState } from "react";
import { useLabReport } from "@/hooks/useLabReport";
import { FileUploader } from "./FileUploader";
import { ReportOutput } from "./ReportOutput";
import type { ExplanationMode } from "@/types/lab-report";

const MODES: { value: ExplanationMode; label: string; description: string }[] = [
  { value: "plain", label: "Plain English", description: "Simple language for everyone" },
  { value: "eli5", label: "Explain Like I'm 12", description: "Extra simple — no jargon" },
  { value: "clinical", label: "Clinical", description: "Medical student level detail" },
];

export function LabReportApp() {
  const { state, explain, cancel, isBusy } = useLabReport();
  const [mode, setMode] = useState<ExplanationMode>("plain");

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 min-h-screen">
      {/* Mode selector + cancel button */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">
          Explanation style:
        </span>
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            disabled={isBusy}
            title={m.description}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors disabled:cursor-not-allowed ${
              mode === m.value
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-sky-400 disabled:opacity-50"
            }`}
          >
            {m.label}
          </button>
        ))}

        {isBusy && (
          <button
            onClick={cancel}
            className="ml-auto px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cancel analysis"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <FileUploader
            onExplain={explain}
            mode={mode}
            busy={isBusy}
          />
        </div>
        <div className="flex-1">
          <ReportOutput state={state} />
        </div>
      </div>
    </div>
  );
}
