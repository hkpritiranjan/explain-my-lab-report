"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type { ReportState, LabTest, NormalStatus, Confidence } from "@/types/lab-report";

interface Props {
  state: Extract<ReportState, { status: "success" }>;
  onReset: () => void;
}

function StatusBadge({ status }: { status: NormalStatus }) {
  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
        <CheckCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Normal
      </span>
    );
  }
  if (status === "no") {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
        <ExclamationTriangleIcon className="w-3.5 h-3.5" aria-hidden="true" />
        Abnormal
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
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
        className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full whitespace-nowrap"
      >
        Some uncertainty
      </span>
    );
  }
  return (
    <span
      title="Low AI confidence — discuss with your doctor"
      className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap"
    >
      Uncertain
    </span>
  );
}

function TestCard({ test, index }: { test: LabTest; index: number }) {
  const leftBorder =
    test.is_likely_normal === "no"
      ? "border-l-red-400 dark:border-l-red-600"
      : test.is_likely_normal === "yes"
      ? "border-l-green-400 dark:border-l-green-600"
      : "border-l-yellow-400 dark:border-l-yellow-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      className={`border border-gray-200 dark:border-gray-700 border-l-4 ${leftBorder} rounded-xl p-4 bg-white dark:bg-gray-900 flex flex-col gap-2`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {test.test_name}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={test.is_likely_normal} />
          <ConfidenceBadge confidence={test.confidence} />
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="font-mono text-sky-700 dark:text-sky-400 font-medium">
          Value: {test.reported_value || "—"}
        </span>
        {test.reference_range && (
          <span className="text-gray-400 dark:text-gray-500">
            Ref: {test.reference_range}
          </span>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        {test.simple_explanation}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 italic border-t border-gray-100 dark:border-gray-800 pt-2">
        {test.recommended_next_step}
      </p>
    </motion.div>
  );
}

export function ReportOutput({ state, onReset }: Props) {
  const { data } = state;
  const abnormalCount = data.tests.filter(t => t.is_likely_normal === "no").length;

  return (
    <div className="space-y-6" aria-live="polite" aria-label="Lab report explanation">
      {/* Header + reset */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Your results explained
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data.tests.length} test{data.tests.length !== 1 ? "s" : ""} found
            {abnormalCount > 0 && (
              <span className="text-red-500 dark:text-red-400 ml-1">
                · {abnormalCount} flagged
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onReset}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors mt-1"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          New report
        </button>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900"
      >
        <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 uppercase tracking-wide mb-1.5">
          Summary
        </p>
        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
          {data.summary}
        </p>
      </motion.div>

      {/* Test cards */}
      {data.tests.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Test Results ({data.tests.length})
          </p>
          {data.tests.map((test, idx) => (
            <TestCard key={test.test_name || idx} test={test} index={idx} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No individual test values were identified in the report.
        </p>
      )}

      {/* Follow-up questions */}
      {data.follow_up_questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: data.tests.length * 0.06 + 0.1 }}
          className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900 rounded-xl p-4"
        >
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Questions to ask your doctor
          </p>
          <ol className="space-y-2">
            {data.follow_up_questions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-violet-500 dark:text-violet-400 font-semibold shrink-0 tabular-nums">
                  {i + 1}.
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Disclaimer */}
      {data.disclaimer && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-400">
          <strong>Disclaimer: </strong>{data.disclaimer}
        </div>
      )}
    </div>
  );
}
