"use client";

import { useState, useCallback } from "react";
import type { LabReport, ReportState, ExplanationMode } from "@/types/lab-report";

export function useLabReport() {
  const [state, setState] = useState<ReportState>({ status: "idle" });

  const explain = useCallback(
    async (text: string, mode: ExplanationMode = "plain") => {
      setState({ status: "loading" });
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, mode }),
        });

        const json = await res.json();

        if (!res.ok) {
          setState({
            status: "error",
            message: (json as { error?: string }).error ?? "Something went wrong. Please try again.",
          });
          return;
        }

        setState({ status: "success", data: json as LabReport });
      } catch {
        setState({
          status: "error",
          message: "Could not reach the server. Please check your connection.",
        });
      }
    },
    []
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, explain, reset };
}
