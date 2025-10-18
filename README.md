# Lab Report AI Explainer

This is a Next.js application that helps users extract and interpret text from lab reports.
It supports both PDF and image uploads, using a combination of PDF parsing and OCR to read the content.
The extracted text is then sent to the OpenAI API for structured, plain-language explanations.

## Features
- Upload lab reports as PDF or image
- Automatic text extraction (PDF parsing and OCR fallback)
- AI-generated summaries and test interpretations
- Clean, responsive UI built with Next.js
- Simple client-server flow using API routes

## Tech Stack
- Next.js
- TypeScript
- Tesseract.js (OCR)
- PDF parsing (`pdf-parse`, `pdf2pic`)
- OpenAI API
- Tailwind CSS

Steps
1. Clone the repo
   ```bash
   git clone https://github.com/your-username/lab-report-ai-explainer.git
2. Install dependencies
   npm install


3. Add your OpenAI API key in lib/openai.ts (or use environment variables).

4. Run the development server

npm run dev


5. Open http://localhost:3000 in your browser.