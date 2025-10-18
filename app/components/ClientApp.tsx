"use client";
import React, { useState } from "react";
import FileUploader from "./FileUploader";
import ReportOutput from "./ReportOutput";

export default function ClientApp() {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendTextToServer(text: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      setExplanation(json.explanation ?? JSON.stringify(json));
    } catch (e) {
      setExplanation("Error contacting server");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 bg-gray-50 min-h-screen">
      <div className="flex-1">
        <FileUploader onSendText={sendTextToServer} />
      </div>
      <div className="flex-1">
        <ReportOutput explanation={explanation} loading={loading} />
      </div>
    </div>
  );
}
