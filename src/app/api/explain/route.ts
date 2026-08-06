import { NextResponse } from "next/server";
import { ExplainRequestSchema } from "@/lib/schemas";
import { explainLabReportStream } from "@/services/ai";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = ExplainRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  // Pass req.signal so the OpenAI call is cancelled if the client disconnects
  const gen = explainLabReportStream(result.data.text, result.data.mode, req.signal);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of gen) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      } catch (err) {
        console.error("[/api/explain] stream error:", err);
        controller.error(err);
      }
    },
    cancel() {
      // Terminate the async generator when the client closes the connection
      void gen.return(undefined);
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
