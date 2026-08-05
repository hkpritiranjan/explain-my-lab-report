const MIN_TEXT_LENGTH = 20;

interface PDFTextResult {
  text: string;
  total: number;
}

interface PDFParseConstructor {
  new (opts: Record<string, unknown>): { getText(): Promise<PDFTextResult> };
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "PARSE_FAILED"
      | "NO_TEXT"
      | "UNSUPPORTED_TYPE"
      | "TOO_LARGE"
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2 exports a class — must use require to avoid ESM/CJS issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse") as { PDFParse: PDFParseConstructor };

  let text: string;
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    text = result.text?.trim() ?? "";
  } catch {
    throw new ExtractionError(
      "Failed to parse this PDF. The file may be corrupted or password-protected.",
      "PARSE_FAILED"
    );
  }

  if (text.length < MIN_TEXT_LENGTH) {
    throw new ExtractionError(
      "No readable text found in this PDF — it is likely a scanned document. " +
        "Take a photo or screenshot of the report and upload it as an image instead.",
      "NO_TEXT"
    );
  }

  return text;
}
