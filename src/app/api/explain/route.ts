import { NextResponse } from "next/server";
import { ExplainRequestSchema } from "@/lib/schemas";
import { explainLabReport } from "@/services/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = ExplainRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const report = await explainLabReport(result.data.text, result.data.mode);
    return NextResponse.json(report);
  } catch (err) {
    console.error("[/api/explain]", err);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
