"use client";

import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import type { ReportState, LabTest, NormalStatus, Confidence } from "@/types/lab-report";

interface Props {
  state: ReportState;
}

function StatusBadge({ status }: { status: NormalStatus }) {
  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
        <CheckCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Normal
      </span>
    );
  }
  if (status === "no") {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
        <ExclamationTriangleIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Abnormal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-50 border border-yellow-200 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
      <QuestionMarkCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
      Unknown
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  if (confidence === "high") return null;
  if (confidence === "medium") {
    return (
      <span
        title="The AI has moderate confidence in this assessment"
        className="inline-flex items-center text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap"
      >
        Some uncertainty
      </span>
    );
  }
  return (
    <span
      title="The AI has low confidence in this assessment — discuss with your doctor"
      className="inline-flex items-center text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap"
    >
      Uncertain
    </span>
  );
}

function TestCard({ test }: { test: LabTest }) {
  const borderColor =
    test.is_likely_normal === "no"
      ? "border-l-red-400"
      : test.is_likely_normal === "yes"
      ? "border-l-green-400"
      : "border-l-yellow-400";

  return (
    <div
      className={`border border-gray-200 border-l-4 ${borderColor} rounded-lg p-4 bg-white flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <span className="text-base font-semibold text-gray-800">{test.test_name}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={test.is_likely_normal} />
          <ConfidenceBadge confidence={test.confidence} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="font-mono text-sky-800 font-medium">
          Value: {test.reported_value || "—"}
        </span>
        {test.reference_range && (
          <span className="text-gray-500">Reference: {test.reference_range}</span>
        )}
      </div>
      <p className="text-gray-700 text-sm leading-relaxed">{test.simple_explanation}</p>
      <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
        {test.recommended_next_step}
      </p>
    </div>
  );
}

function StreamingProgress({ bytesReceived }: { bytesReceived: number }) {
  // Rough estimate: a typical response is ~2KB; cap the visual fill at 95% so it never looks done early
  const fillPct = Math.min(95, (bytesReceived / 2000) * 100);

  return (
    <div role="status" aria-live="polite" className="space-y-3 py-2">
      <p className="text-sky-600 font-medium animate-pulse">Analyzing your report…</p>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-sky-500 h-1.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">Received {bytesReceived} characters…</p>
    </div>
  );
}

export function ReportOutput({ state }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Explained Report</h2>

      {state.status === "loading" && (
        <div role="status" aria-live="polite" className="text-sky-600 font-medium animate-pulse py-2">
          Connecting…
        </div>
      )}

      {state.status === "streaming" && (
        <StreamingProgress bytesReceived={state.bytesReceived} />
      )}

      {state.status === "error" && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 text-sm">
          <strong>Error: </strong>{state.message}
        </div>
      )}

      {state.status === "idle" && (
        <p className="text-gray-400 italic">
          No explanation yet. Submit a report above to get started.
        </p>
      )}

      {state.status === "success" && (
        <div className="space-y-5" aria-live="polite" aria-label="Lab report explanation">
          {/* Summary */}
          <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-1">
              Summary
            </p>
            <p className="text-gray-900 text-sm leading-relaxed">{state.data.summary}</p>
          </div>

          {/* Test results */}
          {state.data.tests.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Test Results ({state.data.tests.length})
              </p>
              <div className="flex flex-col gap-3">
                {state.data.tests.map((test, idx) => (
                  <TestCard key={test.test_name || idx} test={test} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No individual test values were identified in the report.
            </p>
          )}

          {/* Follow-up questions */}
          {state.data.follow_up_questions.length > 0 && (
            <div className="bg-violet-50 border border-violet-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Questions to ask your doctor
              </p>
              <ol className="space-y-2">
                {state.data.follow_up_questions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-violet-500 font-semibold shrink-0 tabular-nums">
                      {i + 1}.
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Disclaimer */}
          {state.data.disclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
              <strong>Disclaimer: </strong>{state.data.disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
