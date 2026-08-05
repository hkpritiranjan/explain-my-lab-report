import OpenAI from "openai";

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Copy .env.example to .env.local and add your key."
    );
  }
  return new OpenAI({ apiKey });
}

// Lazily initialized so the build doesn't fail without an env file.
let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (!_client) _client = getOpenAIClient();
  return _client;
}
