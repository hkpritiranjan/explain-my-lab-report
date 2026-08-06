export type ExplanationMode = "plain" | "eli5" | "clinical";
export type NormalStatus = "yes" | "no" | "unknown";
export type Confidence = "high" | "medium" | "low";

export interface LabTest {
  test_name: string;
  reported_value: string;
  reference_range: string | null;
  is_likely_normal: NormalStatus;
  confidence: Confidence;
  simple_explanation: string;
  recommended_next_step: string;
}

export interface LabReport {
  summary: string;
  disclaimer: string;
  follow_up_questions: string[];
  tests: LabTest[];
}

// Discriminated union state machine — compiler prevents accessing .data on error, etc.
export type ReportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "streaming"; bytesReceived: number }
  | { status: "success"; data: LabReport }
  | { status: "error"; message: string };
