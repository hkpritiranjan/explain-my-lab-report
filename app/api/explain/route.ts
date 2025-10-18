import { NextResponse } from "next/server";
import openai from "../../lib/openai";
import fs from "fs";
import path from "path";
import os from "os";
const { PDFParse } = require('pdf-parse');
const { fromBuffer } = require("pdf2pic");
const Tesseract = require("tesseract.js-node");

// Helper to extract text from PDF using pdf-parse
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
    const data = new PDFParse({ data: buffer });
    const textResult = await data.getText();
    return textResult.text || "";
}

// Helper to convert PDF buffer to image for OCR (fallback)
async function convertPdfToImage(buffer: Buffer): Promise<Buffer> {
    const outputOptions = {
        density: 300,
        format: "png",
        width: 1600,
        height: 2000,
    };

    const convert = fromBuffer(buffer, outputOptions);
    const pageOutput = await convert.bulk(-1);
    return pageOutput[0].buffer;
}

// Helper to perform OCR using tesseract.js-node
async function performOcr(imageBuffer: Buffer): Promise<string> {
    const tempImagePath = path.join(os.tmpdir(), `image-${Date.now()}.png`);
    fs.writeFileSync(tempImagePath, imageBuffer);

    return new Promise((resolve, reject) => {
        Tesseract.recognize(tempImagePath, { lang: "eng" }, (err: Error, result: any) => {
            fs.unlinkSync(tempImagePath);
            if (err) return reject(err);
            resolve(result.text.trim());
        });
    });
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let labText = "";

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData();
            const file = form.get("file") as File | null;
            const text = form.get("text") as string | null;

            if (file && file.size > 0) {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                console.log('xxx file type :->', file)
                if (file.type === "application/pdf") {
                    try {
                        labText = await extractTextFromPdfBuffer(buffer);
                        console.log('xxx labtext :-->', labText)
                    } catch (error) {
                        console.error("PDF parsing error:", error);
                        labText = "";
                    }

                    // Fallback to OCR if no text was extracted
                    if (!labText || labText.trim().length < 5) {
                        console.log("PDF extraction returned empty. Falling back to OCR...");
                        try {
                            const imageBuffer = await convertPdfToImage(buffer);
                            labText = await performOcr(imageBuffer);
                        } catch (ocrError) {
                            console.error("OCR error:", ocrError);
                            return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 400 });
                        }
                    }
                } else {
                    labText = text ?? "";
                }
            } else {
                labText = text ?? "";
            }
        } else {
            const body = await req.json();
            labText = body.text ?? "";
        }

        if (!labText || labText.trim().length < 5) {
            return NextResponse.json({ error: "No valid lab text found" }, { status: 400 });
        }

        const prompt = `
You are a clear, cautious medical assistant. Given the plain text of a patient's laboratory report, do all of the following:
1) Extract each test name and numeric value (if present). For each test provide:
   - test_name
   - reported_value (as string)
   - is_likely_normal: yes/no/unknown
   - simple_explanation: one or two sentences in plain language
   - recommended_next_step: short guidance (for example, "see your doctor" or "likely ok but monitor")
2) At the top provide a 2-3 sentence plain-language summary of the whole report.
3) Always include this clear disclaimer: "This tool is for education only and not a substitute for professional medical advice."

Return JSON with keys: summary and tests (array).
Lab text:
"""${labText}"""
Keep answers factual and avoid overconfident medical conclusions.
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
        });

        const explanation = completion.choices?.[0]?.message?.content ?? "";
        return NextResponse.json({ explanation });
    } catch (err) {
        console.error("Server error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
