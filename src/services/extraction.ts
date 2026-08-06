import { extractText } from "unpdf";

const MIN_TEXT_LENGTH = 20;

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
  let text: string;
  try {
    // unpdf wraps pdfjs-dist with the worker disabled — safe in serverless (Node 18+)
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
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
