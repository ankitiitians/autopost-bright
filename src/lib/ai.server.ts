// Server-only helpers for Lovable AI Gateway (text + image generation).
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function apiKey() {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new Error("LOVABLE_API_KEY is not configured");
  return k;
}

export async function generateText(opts: {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
}): Promise<string> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages: [
        ...(opts.systemPrompt ? [{ role: "system", content: opts.systemPrompt }] : []),
        { role: "user", content: opts.userPrompt },
      ],
    }),
  });
  if (res.status === 429) throw new Error("AI rate limit exceeded — try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted — add funds in Lovable workspace.");
  if (!res.ok) throw new Error(`AI gateway error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

/**
 * Generates an image via Nano Banana. Returns the raw bytes + mime type
 * so the caller can upload to Supabase Storage.
 */
export async function generateImage(prompt: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (res.status === 429) throw new Error("Image AI rate limit exceeded.");
  if (res.status === 402) throw new Error("Image AI credits exhausted.");
  if (!res.ok) throw new Error(`Image gateway error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const url: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url || !url.startsWith("data:")) throw new Error("No image returned");
  const [meta, b64] = url.split(",");
  const mime = meta.match(/data:([^;]+)/)?.[1] ?? "image/png";
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return { bytes: buf, mime };
}
