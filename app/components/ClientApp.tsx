"use client";
import React, { useState } from "react";
import FileUploader from "./FileUploader";
import ReportOutput from "./ReportOutput";

export default function ClientApp() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendTextToServer(text: string) {
    setLoading(true);
    setError(null);
    setExplanation(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setExplanation(json.explanation ?? null);
    } catch {
      setError("Could not reach the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 bg-gray-50 min-h-screen">
      <div className="flex-1">
        <FileUploader onSendText={sendTextToServer} busy={loading} />
      </div>
      <div className="flex-1">
        <ReportOutput explanation={explanation} loading={loading} error={error} />
      </div>
    </div>
  );
}
