import { z } from "zod";

// ── Request schemas (API input validation) ──────────────────────────────────

export const ExplainRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(10, "Lab text is too short to analyze.")
    .max(200_000, "Lab text is too long. Please submit a shorter document."),
  mode: z.enum(["plain", "eli5", "clinical"]).default("plain"),
});

export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;

// ── Response schemas (AI output validation) ─────────────────────────────────

export const LabTestSchema = z.object({
  test_name: z.string(),
  reported_value: z.string(),
  reference_range: z.string().nullable().optional().transform(v => v ?? null),
  is_likely_normal: z.enum(["yes", "no", "unknown"]),
  confidence: z.enum(["high", "medium", "low"]),
  simple_explanation: z.string(),
  recommended_next_step: z.string(),
});

export const LabReportSchema = z.object({
  summary: z.string(),
  disclaimer: z.string(),
  follow_up_questions: z.array(z.string()).default([]),
  tests: z.array(LabTestSchema),
});
