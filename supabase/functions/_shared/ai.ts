// Shared AI API key resolver: AI_API_KEY veya GEMINI_API_KEY fallback
// OpenAI-uyumlu endpoint varsayılır. Gemini kullanılıyorsa AI_API_URL
// environment variable'ı Gemini'nin OpenAI-uyumlu proxy'sine ayarlanmalı.

export function getAiApiKey(): string | undefined {
  return Deno.env.get("AI_API_KEY") ?? Deno.env.get("GEMINI_API_KEY");
}
