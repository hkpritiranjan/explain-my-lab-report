"use client";

import { useState, useCallback, useRef } from "react";
import type { LabReport, ReportState, ExplanationMode } from "@/types/lab-report";
import { LabReportSchema } from "@/lib/schemas";

export function useLabReport() {
  const [state, setState] = useState<ReportState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ status: "idle" });
  }, []);

  const explain = useCallback(
    async (text: string, mode: ExplanationMode = "plain") => {
      // Cancel any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: "loading" });

      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, mode }),
          signal: controller.signal,
        });

        // Non-streaming error (validation failure, server error before stream starts)
        if (!res.ok) {
          const json = (await res.json()) as { error?: string };
          setState({
            status: "error",
            message: json.error ?? "Something went wrong. Please try again.",
          });
          return;
        }

        if (!res.body) {
          setState({ status: "error", message: "No response received from server." });
          return;
        }

        // Accumulate the streamed JSON chunks
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setState({ status: "streaming", bytesReceived: accumulated.length });
        }

        // Parse and validate the complete JSON response
        let raw: unknown;
        try {
          raw = JSON.parse(accumulated);
        } catch {
          setState({
            status: "error",
            message: "Received an invalid response. Please try again.",
          });
          return;
        }

        const validated = LabReportSchema.safeParse(raw);
        if (!validated.success) {
          setState({
            status: "error",
            message: "Unexpected response format. Please try again.",
          });
          return;
        }

        setState({ status: "success", data: validated.data as LabReport });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled — return to idle silently
          setState({ status: "idle" });
          return;
        }
        setState({
          status: "error",
          message: "Could not reach the server. Please check your connection.",
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ status: "idle" });
  }, []);

  const isBusy = state.status === "loading" || state.status === "streaming";

  return { state, explain, reset, cancel, isBusy };
}
