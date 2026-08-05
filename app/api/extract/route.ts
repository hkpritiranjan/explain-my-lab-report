import { NextResponse } from "next/server";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

interface TextResult {
  text: string;
  total: number;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error:
            "Only PDF files are handled server-side. " +
            "To analyze an image, use the image upload option above.",
        },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse v2: class-based API — new PDFParse({ data: Buffer })
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse") as {
      PDFParse: new (opts: Record<string, unknown>) => { getText(): Promise<TextResult> };
    };

    let text: string;
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text?.trim() ?? "";
    } catch (err) {
      console.error("pdf-parse error:", err);
      return NextResponse.json(
        { error: "Failed to parse this PDF. The file may be corrupted or password-protected." },
        { status: 422 }
      );
    }

    if (text.length < 20) {
      return NextResponse.json(
        {
          error:
            "No readable text found in this PDF — it is likely a scanned document. " +
            "Take a photo or screenshot of the report and upload it as an image instead.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Extract route error:", err);
    return NextResponse.json(
      { error: "Server error during text extraction." },
      { status: 500 }
    );
  }
}
