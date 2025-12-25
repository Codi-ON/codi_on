/**
 * Gemini client wrapper (browser-safe).
 *
 * - Keeps all AI wiring isolated in this file.
 * - Uses Vite env vars: import.meta.env.VITE_GEMINI_API_KEY
 *
 * NOTE:
 * For production, prefer calling Gemini through your backend (proxy) so you do NOT expose API keys to the browser.
 */

export type GeminiGenerateParams = {
  prompt: string;
  /**
   * If you are proxying via your backend, set VITE_GEMINI_API_BASE_URL to something like "/api/gemini"
   * and implement the backend call there.
   */
  baseUrl?: string;
  model?: string;
};

function getApiKey(): string | undefined {
  // Vite exposes only VITE_ prefixed vars
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || undefined;
}

function getBaseUrl(): string {
  // If you proxy, set VITE_GEMINI_API_BASE_URL (recommended)
  const fromEnv = (import.meta.env.VITE_GEMINI_API_BASE_URL as string | undefined) || "";
  if (fromEnv) return fromEnv;

  // Direct-to-Google fallback (NOT recommended for real apps because it exposes the key)
  return "https://generativelanguage.googleapis.com/v1beta";
}

/**
 * Minimal text generation call.
 * If baseUrl starts with "/", it is assumed to be your own backend proxy endpoint.
 */
export async function geminiGenerateText(params: GeminiGenerateParams): Promise<string> {
  const { prompt, model = "models/gemini-1.5-flash", baseUrl } = params;
  const apiBase = baseUrl || getBaseUrl();
  const apiKey = getApiKey();

  if (!apiBase.startsWith("/") && !apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY. Set it in .env.local (Vite requires VITE_ prefix).");
  }

  // Proxy mode: POST /api/gemini { prompt, model }
  if (apiBase.startsWith("/")) {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model }),
    });
    if (!res.ok) throw new Error(`Gemini proxy error: ${res.status}`);
    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  }

  // Direct mode (Google API)
  const url = `${apiBase}/${model}:generateContent?key=${encodeURIComponent(apiKey!)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const json = await res.json() as any;
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("") ?? "";
  return text;
}
