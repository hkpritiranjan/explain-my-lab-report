import { getClient } from "@/lib/openai";
import type { ExplanationMode } from "@/types/lab-report";

export const PROMPT_VERSION = "2.0.0";

const MAX_INPUT_CHARS = 60_000;

const SYSTEM_PROMPT = `You are a careful, clear medical assistant helping patients understand their laboratory results.
Explain findings in plain, non-technical language a non-medical adult can understand.
Never make definitive diagnoses. Always recommend consulting a doctor for medical decisions.
Be accurate, empathetic, and concise.`;

function toneGuide(mode: ExplanationMode): string {
  switch (mode) {
    case "eli5":
      return "Explain everything as if to a curious 12-year-old with no medical knowledge. Use simple words, fun analogies (e.g., comparing white blood cells to tiny security guards), and a warm, reassuring tone. Avoid all medical jargon completely.";
    case "clinical":
      return "Use appropriate clinical terminology for a medical student or healthcare professional. Include relevant pathophysiology context where useful, note which findings may warrant further workup, and use standard medical abbreviations (e.g., WBC, Hgb, eGFR) with brief explanations.";
    default:
      return "Use plain, friendly language for a general adult audience with no medical background. Explain what each test measures and what the result means practically in everyday life.";
  }
}

// JSON Schema for OpenAI structured outputs (strict mode).
// All fields required, additionalProperties: false, nullable via anyOf.
const LAB_REPORT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "2-3 sentence plain-language overview of the overall report",
    },
    disclaimer: { type: "string" },
    follow_up_questions: {
      type: "array",
      items: { type: "string" },
      description: "2-3 specific questions the patient could ask their doctor at their next appointment",
    },
    tests: {
      type: "array",
      items: {
        type: "object",
        properties: {
          test_name: { type: "string" },
          reported_value: { type: "string" },
          reference_range: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
          is_likely_normal: {
            type: "string",
            enum: ["yes", "no", "unknown"],
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description:
              "high: clear comparison with reference range possible; medium: value is typical/atypical but range is missing; low: significant ambiguity",
          },
          simple_explanation: { type: "string" },
          recommended_next_step: { type: "string" },
        },
        required: [
          "test_name",
          "reported_value",
          "reference_range",
          "is_likely_normal",
          "confidence",
          "simple_explanation",
          "recommended_next_step",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "disclaimer", "follow_up_questions", "tests"],
  additionalProperties: false,
};

function buildUserMessage(labText: string, mode: ExplanationMode): string {
  return `${toneGuide(mode)}

Analyze the laboratory report below. For each test result:
- Identify what the test measures and whether the value appears normal, abnormal, or uncertain
- Set confidence to "high" if you can clearly compare the value to a reference range, "medium" if the range is missing but the value is recognizably typical or atypical, "low" if there is significant ambiguity
- The follow_up_questions should be actionable and specific to this patient's results

Lab report:
"""
${labText}
"""`.trim();
}

export async function* explainLabReportStream(
  rawText: string,
  mode: ExplanationMode = "plain",
  signal?: AbortSignal
): AsyncGenerator<string> {
  const text =
    rawText.length > MAX_INPUT_CHARS ? rawText.slice(0, MAX_INPUT_CHARS) : rawText;

  const stream = await getClient().chat.completions.create(
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(text, mode) },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      stream: true,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lab_report_explanation",
          strict: true,
          schema: LAB_REPORT_JSON_SCHEMA,
        },
      },
    },
    { signal }
  );

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) yield delta;
  }
}
