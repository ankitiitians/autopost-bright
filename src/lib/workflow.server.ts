// Server-only workflow orchestration (admin operations).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateImage, generateText } from "./ai.server";
import { publishToInstagram, publishToLinkedIn } from "./publish.server";

export type Tone = "Authoritative" | "Educational" | "Inspirational";

export async function loadSettings() {
  const { data, error } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function logEvent(
  level: "INFO" | "SUCCESS" | "ERROR" | "WARNING",
  message: string,
  runId?: string,
) {
  await supabaseAdmin.from("logs").insert({ level, message, run_id: runId ?? null });
}

function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export async function generateLinkedInText(topic: string, tone: string) {
  const s = await loadSettings();
  const prompt = applyTemplate(s.linkedin_prompt, { topic, tone });
  return generateText({ userPrompt: prompt });
}

export async function generateInstagramText(topic: string) {
  const s = await loadSettings();
  const prompt = applyTemplate(s.instagram_prompt, { topic, tone: "engaging" });
  return generateText({ userPrompt: prompt });
}

export async function generateAndStoreImage(opts: {
  topic: string;
  imageStyle: string;
  customPrompt?: string;
}): Promise<{ url: string; prompt: string }> {
  const s = await loadSettings();
  const prompt =
    opts.customPrompt && opts.customPrompt.trim().length > 0
      ? opts.customPrompt
      : applyTemplate(s.image_prompt, { topic: opts.topic, imageStyle: opts.imageStyle });

  const { bytes, mime } = await generateImage(prompt);
  const ext = mime === "image/jpeg" ? "jpg" : "png";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from("generated-images")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  const { data } = supabaseAdmin.storage.from("generated-images").getPublicUrl(path);
  return { url: data.publicUrl, prompt };
}

export async function recordPost(p: {
  topic: string;
  platform: "linkedin" | "instagram";
  status: "success" | "failed" | "pending";
  content: string;
  image_url?: string;
  image_prompt?: string;
  external_id?: string;
  error_msg?: string;
  run_id?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .insert({
      topic: p.topic,
      platform: p.platform,
      status: p.status,
      content: p.content,
      image_url: p.image_url ?? null,
      image_prompt: p.image_prompt ?? null,
      external_id: p.external_id ?? null,
      error_msg: p.error_msg ?? null,
      run_id: p.run_id ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Suggest a topic (used by cron and Run-Now). */
export async function pickTopic(): Promise<string> {
  const s = await loadSettings();
  const text = await generateText({
    userPrompt: `Suggest one fresh, specific, trending content topic in the "${s.default_category}" category for a social media post today. Reply with ONLY the topic phrase, max 8 words, no punctuation, no quotes.`,
  });
  return text.split("\n")[0].replace(/^["']|["']$/g, "").trim() || s.default_category;
}

/** Full daily workflow: pick topic → generate → image → publish to enabled platforms. */
export async function runDailyWorkflow(opts?: { topic?: string }): Promise<{
  runId: string;
  topic: string;
  results: Array<{ platform: "linkedin" | "instagram"; status: "success" | "failed"; error?: string }>;
}> {
  const runId = crypto.randomUUID();
  const settings = await loadSettings();
  await logEvent("INFO", "Workflow started", runId);

  const topic = opts?.topic ?? (await pickTopic());
  await logEvent("SUCCESS", `Topic selected: "${topic}"`, runId);

  let imageUrl: string | undefined;
  let imagePrompt: string | undefined;
  try {
    await logEvent("INFO", "Generating AI image…", runId);
    const img = await generateAndStoreImage({
      topic,
      imageStyle: settings.default_image_style,
    });
    imageUrl = img.url;
    imagePrompt = img.prompt;
    await logEvent("SUCCESS", `Image generated and uploaded`, runId);
  } catch (e) {
    await logEvent("ERROR", `Image generation failed: ${(e as Error).message}`, runId);
  }

  const results: Array<{ platform: "linkedin" | "instagram"; status: "success" | "failed"; error?: string }> =
    [];

  if (settings.post_to_linkedin) {
    try {
      await logEvent("INFO", "Generating LinkedIn post…", runId);
      const text = await generateLinkedInText(topic, settings.default_tone);
      await logEvent("INFO", "Publishing to LinkedIn…", runId);
      const r = await publishToLinkedIn({ text, imageUrl });
      await recordPost({
        topic,
        platform: "linkedin",
        status: "success",
        content: text,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        external_id: r.externalId,
        run_id: runId,
      });
      await logEvent("SUCCESS", "LinkedIn post published", runId);
      results.push({ platform: "linkedin", status: "success" });
    } catch (e) {
      const msg = (e as Error).message;
      await logEvent("ERROR", `LinkedIn failed: ${msg}`, runId);
      await recordPost({
        topic,
        platform: "linkedin",
        status: "failed",
        content: "",
        image_url: imageUrl,
        image_prompt: imagePrompt,
        error_msg: msg,
        run_id: runId,
      });
      results.push({ platform: "linkedin", status: "failed", error: msg });
    }
  }

  if (settings.post_to_instagram) {
    try {
      if (!imageUrl) throw new Error("Instagram requires an image but image generation failed.");
      await logEvent("INFO", "Generating Instagram caption…", runId);
      const text = await generateInstagramText(topic);
      await logEvent("INFO", "Publishing to Instagram…", runId);
      const r = await publishToInstagram({ caption: text, imageUrl });
      await recordPost({
        topic,
        platform: "instagram",
        status: "success",
        content: text,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        external_id: r.externalId,
        run_id: runId,
      });
      await logEvent("SUCCESS", "Instagram post published", runId);
      results.push({ platform: "instagram", status: "success" });
    } catch (e) {
      const msg = (e as Error).message;
      await logEvent("ERROR", `Instagram failed: ${msg}`, runId);
      await recordPost({
        topic,
        platform: "instagram",
        status: "failed",
        content: "",
        image_url: imageUrl,
        image_prompt: imagePrompt,
        error_msg: msg,
        run_id: runId,
      });
      results.push({ platform: "instagram", status: "failed", error: msg });
    }
  }

  const ok = results.filter((r) => r.status === "success").length;
  await logEvent("SUCCESS", `Workflow complete — ${ok}/${results.length} posts published`, runId);
  return { runId, topic, results };
}
