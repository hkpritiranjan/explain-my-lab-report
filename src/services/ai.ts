import { getClient } from "@/lib/openai";
import { LabReportSchema } from "@/lib/schemas";
import type { LabReport, ExplanationMode } from "@/types/lab-report";

export const PROMPT_VERSION = "1.0.0";

const MAX_INPUT_CHARS = 60_000;

const SYSTEM_PROMPT = `You are a careful, clear medical assistant that helps patients understand their laboratory results.
Explain findings in plain, non-technical language a non-medical adult can understand.
Never make definitive diagnoses. Always recommend consulting a doctor for medical decisions.
You must respond with valid JSON only — no markdown, no code blocks, no extra text outside the JSON object.`;

function toneGuide(mode: ExplanationMode): string {
  switch (mode) {
    case "eli5":
      return "Use extremely simple language — explain as if to a curious 12-year-old with no medical background.";
    case "clinical":
      return "Use clinical terminology appropriate for a medical student learning to interpret lab results.";
    default:
      return "Use plain language suitable for a general adult audience with no medical background.";
  }
}

function buildPrompt(labText: string, mode: ExplanationMode): string {
  return `${toneGuide(mode)}

Analyze the laboratory report below and return a JSON object with this exact structure:
{
  "summary": "2-3 sentence plain-language overview of the whole report",
  "disclaimer": "This explanation is for educational purposes only and is not a substitute for professional medical advice. Always consult your doctor or a qualified healthcare provider.",
  "tests": [
    {
      "test_name": "name of the test",
      "reported_value": "the value exactly as shown in the report",
      "reference_range": "the normal range if present, otherwise null",
      "is_likely_normal": "yes | no | unknown",
      "simple_explanation": "1-2 sentences explaining what this test measures and what the value means",
      "recommended_next_step": "short practical guidance, e.g. 'Discuss with your doctor' or 'Within normal range, no action needed'"
    }
  ]
}

Lab report:
"""
${labText}
"""`.trim();
}

export async function explainLabReport(
  rawText: string,
  mode: ExplanationMode = "plain"
): Promise<LabReport> {
  const text = rawText.length > MAX_INPUT_CHARS
    ? rawText.slice(0, MAX_INPUT_CHARS)
    : rawText;

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(text, mode) },
    ],
    max_tokens: 2048,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  const parsed = LabReportSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("AI response did not match expected schema.");
  }

  return parsed.data;
}
