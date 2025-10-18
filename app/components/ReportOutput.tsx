"use client";
import { CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import React from "react";

interface Props {
  explanation: string | null;
  loading: boolean;
}

interface LabTest {
  test_name: string;
  reported_value: string;
  is_likely_normal: "yes" | "no" | "unknown";
  simple_explanation: string;
  recommended_next_step: string;
}

interface LabReport {
  summary: string;
  tests: LabTest[];
}

export default function ReportOutput({ explanation, loading }: Props) {
    let parsed: LabReport | null = null;
    let disclaimer: string | null = null;

    try {
      if (explanation) {
        let cleaned = explanation.trim();

        // Remove leading BOM if present
        if (cleaned.charCodeAt(0) === 0xFEFF) cleaned = cleaned.slice(1);

        // Handle triple-backtick code block (common from GPT)
        if (cleaned.startsWith('````')){
          const endIdx = cleaned.indexOf('```', 7);
          const jsonBlock = cleaned.substring(7, endIdx).trim();
          parsed = JSON.parse(jsonBlock);

          // Extract disclaimer after code block, possibly with markdown
          const rest = cleaned.substring(endIdx + 3).replace(/^\n+/, '');
          if (rest) disclaimer = rest.replace(/^\*\*Disclaimer:\*\*\s*/i, "");
        } else if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
          // Pure JSON (no code block)
          parsed = JSON.parse(cleaned);
        }
      }
    } catch {
      parsed = null;
    }


  const tests = Array.isArray(parsed?.tests) ? parsed.tests : [];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex-1">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Explained Report</h2>

      {loading && (
        <div className="text-sky-600 font-medium animate-pulse">
          Analyzing your report…
        </div>
      )}

      {!loading && !explanation && (
        <div className="text-gray-400 italic">
          No explanation yet. Submit a report to begin.
        </div>
      )}

      {/* Render Structured Output */}
      {!loading && parsed && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
            <span className="font-medium text-gray-700 block mb-2">Summary</span>
            <p className="text-gray-900 text-base leading-relaxed">{parsed.summary}</p>
          </div>

          {/* Tests */}
          {tests.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 block mb-2">Test Results</span>
              <div className="grid gap-4">
                {tests.map((test, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50"
                  >
                    <div>
                      <div className="text-lg text-gray-800 font-semibold mb-1">{test.test_name}</div>
                      <div className="text-gray-700 text-sm mb-2">{test.simple_explanation}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <span className="font-mono text-base text-sky-800">
                          Value: {test.reported_value || "—"}
                        </span>
                        {(test.is_likely_normal === "yes") && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircleIcon className="w-5 h-5"/>
                            Normal
                          </span>
                        )}
                        {(test.is_likely_normal === "no") && (
                          <span className="flex items-center gap-1 text-red-500">
                            <ExclamationTriangleIcon className="w-5 h-5"/>
                            Abnormal
                          </span>
                        )}
                        {(test.is_likely_normal === "unknown") && (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <ExclamationTriangleIcon className="w-5 h-5"/>
                            Unknown
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 italic">{test.recommended_next_step}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If no tests found */}
          {tests.length === 0 && (
            <div className="text-sm text-gray-400 italic">
              No specific tests were identified in the report.
            </div>
          )}

          {/* Disclaimer if present */}
          {disclaimer && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs text-gray-600">
              {disclaimer}
            </div>
          )}
        </div>
      )}

      {/* Fallback for invalid JSON or unexpected responses */}
      {!loading && explanation && !parsed && (
        <pre className="whitespace-pre-wrap text-gray-600 text-sm bg-gray-50 p-4 rounded-md border">
          {explanation}
        </pre>
      )}
    </div>
  );
}
