import { NextResponse } from "next/server";
import { extractTextFromPdf, ExtractionError } from "@/services/extraction";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data." }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 10 MB." }, { status: 413 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are handled server-side. Upload an image to use browser OCR." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPdf(buffer);

    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof ExtractionError) {
      const status = err.code === "TOO_LARGE" ? 413 : err.code === "UNSUPPORTED_TYPE" ? 415 : 422;
      return NextResponse.json({ error: err.message }, { status });
    }
    console.error("[/api/extract]", err);
    return NextResponse.json({ error: "Server error during text extraction." }, { status: 500 });
  }
}
