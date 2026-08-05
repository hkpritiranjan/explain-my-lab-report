"use client";
import React from "react";
import { CheckCircleIcon, ExclamationTriangleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  explanation: string | null;
  loading: boolean;
  error: string | null;
}

interface LabTest {
  test_name: string;
  reported_value: string;
  reference_range?: string | null;
  is_likely_normal: "yes" | "no" | "unknown";
  simple_explanation: string;
  recommended_next_step: string;
}

interface LabReport {
  summary: string;
  disclaimer: string;
  tests: LabTest[];
}

function parseExplanation(raw: string): LabReport | null {
  try {
    const parsed: unknown = JSON.parse(raw.trim());
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "summary" in parsed &&
      "tests" in parsed &&
      Array.isArray((parsed as LabReport).tests)
    ) {
      return parsed as LabReport;
    }
    return null;
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: "yes" | "no" | "unknown" }) {
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

function TestCard({ test }: { test: LabTest }) {
  const borderColor =
    test.is_likely_normal === "no"
      ? "border-l-red-400"
      : test.is_likely_normal === "yes"
      ? "border-l-green-400"
      : "border-l-yellow-400";

  return (
    <div className={`border border-gray-200 border-l-4 ${borderColor} rounded-lg p-4 bg-white flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-base font-semibold text-gray-800">{test.test_name}</span>
        <StatusBadge status={test.is_likely_normal} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="font-mono text-sky-800 font-medium">
          Value: {test.reported_value || "—"}
        </span>
        {test.reference_range && (
          <span className="text-gray-500">
            Reference: {test.reference_range}
          </span>
        )}
      </div>

      <p className="text-gray-700 text-sm leading-relaxed">{test.simple_explanation}</p>

      <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">
        {test.recommended_next_step}
      </p>
    </div>
  );
}

export default function ReportOutput({ explanation, loading, error }: Props) {
  const parsed = explanation ? parseExplanation(explanation) : null;
  const tests = parsed?.tests ?? [];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Explained Report</h2>

      {loading && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 text-sky-600 font-medium">
          <span className="animate-pulse">Analyzing your report…</span>
        </div>
      )}

      {error && !loading && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 text-sm">
          <strong>Error: </strong>{error}
        </div>
      )}

      {!loading && !error && !explanation && (
        <p className="text-gray-400 italic">
          No explanation yet. Submit a report above to get started.
        </p>
      )}

      {!loading && parsed && (
        <div className="space-y-5" aria-live="polite" aria-label="Lab report explanation">
          <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
            <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-1">Summary</p>
            <p className="text-gray-900 text-sm leading-relaxed">{parsed.summary}</p>
          </div>

          {tests.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Test Results ({tests.length})
              </p>
              <div className="flex flex-col gap-3">
                {tests.map((test, idx) => (
                  <TestCard key={test.test_name || idx} test={test} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No individual test values were identified in the report.
            </p>
          )}

          {parsed.disclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800">
              <strong>Disclaimer: </strong>{parsed.disclaimer}
            </div>
          )}
        </div>
      )}

      {!loading && !error && explanation && !parsed && (
        <pre className="whitespace-pre-wrap text-gray-600 text-sm bg-gray-50 p-4 rounded-md border overflow-x-auto">
          {explanation}
        </pre>
      )}
    </div>
  );
}
