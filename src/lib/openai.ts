import OpenAI from "openai";

function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Copy .env.example to .env.local and add your key."
    );
  }
  return new OpenAI({ apiKey });
}

// Lazily initialized so `npm run build` works without a real .env.local
let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (!_client) _client = createClient();
  return _client;
}
