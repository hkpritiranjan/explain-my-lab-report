import { NextResponse } from "next/server";
import { getClient } from "../../lib/openai";

const SYSTEM_PROMPT = `You are a careful, clear medical assistant that helps patients understand their laboratory results.
Explain findings in plain, non-technical language a non-medical adult can understand.
Never make definitive diagnoses. Always recommend consulting a doctor for medical decisions.
You must respond with valid JSON only — no markdown, no code blocks, no extra text outside the JSON object.`;

function buildUserPrompt(labText: string, mode: string): string {
  const toneGuide =
    mode === "eli5"
      ? "Use extremely simple language — explain as if to a curious 12-year-old with no medical background."
      : mode === "clinical"
      ? "Use clinical terminology appropriate for a medical student."
      : "Use plain language suitable for a general adult audience.";

  return `${toneGuide}

Analyze the laboratory report below and return a JSON object with this exact structure:
{
  "summary": "2-3 sentence plain-language overview of the whole report",
  "disclaimer": "This explanation is for educational purposes only and is not a substitute for professional medical advice. Always consult your doctor or a qualified healthcare provider.",
  "tests": [
    {
      "test_name": "name of the test",
      "reported_value": "the value as shown in the report",
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const labText = typeof body.text === "string" ? body.text.trim() : "";
    const mode = typeof body.mode === "string" ? body.mode : "plain";

    if (labText.length < 10) {
      return NextResponse.json(
        { error: "Lab text is too short to analyze." },
        { status: 400 }
      );
    }

    // Truncate very long text rather than rejecting — PDFs can include headers/footers
    // that inflate length. gpt-4o-mini handles 128k tokens so 60k chars (~15k tokens) is fine.
    const MAX_CHARS = 60_000;
    const truncated = labText.length > MAX_CHARS ? labText.slice(0, MAX_CHARS) : labText;

    const completion = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(truncated, mode) },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    return NextResponse.json({ explanation: content });
  } catch (err) {
    console.error("Explain route error:", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
