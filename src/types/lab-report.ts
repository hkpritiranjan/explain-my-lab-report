export type ExplanationMode = "plain" | "eli5" | "clinical";
export type NormalStatus = "yes" | "no" | "unknown";

export interface LabTest {
  test_name: string;
  reported_value: string;
  reference_range: string | null;
  is_likely_normal: NormalStatus;
  simple_explanation: string;
  recommended_next_step: string;
}

export interface LabReport {
  summary: string;
  disclaimer: string;
  tests: LabTest[];
}

// Discriminated union for async state — eliminates separate loading/error/data booleans
export type ReportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: LabReport }
  | { status: "error"; message: string };
