// Server functions exposed to the client. Keep this file thin: only
// createServerFn declarations + their imports. Heavier logic lives in
// `./workflow.server.ts` and `./publish.server.ts`.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  generateAndStoreImage,
  generateInstagramText,
  generateLinkedInText,
  runDailyWorkflow,
} from "./workflow.server";
import { publishToInstagram, publishToLinkedIn } from "./publish.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const start30 = new Date();
    start30.setDate(start30.getDate() - 30);

    const [today, week, last30, recent, settings] = await Promise.all([
      supabaseAdmin.from("posts").select("id,status", { count: "exact" }).gte("posted_at", startOfToday.toISOString()),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }).gte("posted_at", startOfWeek.toISOString()),
      supabaseAdmin.from("posts").select("status").gte("posted_at", start30.toISOString()),
      supabaseAdmin.from("posts").select("*").order("posted_at", { ascending: false }).limit(10),
      supabaseAdmin.from("settings").select("*").eq("id", 1).single(),
    ]);

    const totalLast30 = last30.data?.length ?? 0;
    const okLast30 = (last30.data ?? []).filter((p) => p.status === "success").length;
    const successRate = totalLast30 === 0 ? 100 : Math.round((okLast30 / totalLast30) * 1000) / 10;

    return {
      postsToday: today.count ?? 0,
      postsThisWeek: week.count ?? 0,
      successRate,
      recent: recent.data ?? [],
      settings: settings.data,
    };
  });

export const listPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("posted_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const listLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data;
  });

export const clearLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { error } = await supabaseAdmin.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
    if (error) throw new Error(error.message);
    return data;
  });

const SettingsSchema = z.object({
  app_name: z.string().min(1).max(100).optional(),
  schedule_enabled: z.boolean().optional(),
  post_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().min(1).max(64).optional(),
  active_days: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).optional(),
  default_category: z.string().min(1).max(64).optional(),
  default_tone: z.string().min(1).max(64).optional(),
  default_image_style: z.string().min(1).max(64).optional(),
  post_to_linkedin: z.boolean().optional(),
  post_to_instagram: z.boolean().optional(),
  notification_email: z.string().email().nullable().optional(),
  linkedin_prompt: z.string().min(10).max(4000).optional(),
  instagram_prompt: z.string().min(10).max(4000).optional(),
  image_prompt: z.string().min(10).max(4000).optional(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SettingsSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("settings")
      .update(data)
      .eq("id", 1)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const generateLinkedIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ topic: z.string().min(1).max(200), tone: z.string().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data }) => ({ text: await generateLinkedInText(data.topic, data.tone) }));

export const generateInstagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ topic: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => ({ text: await generateInstagramText(data.topic) }));

export const generateImageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        topic: z.string().min(1).max(200),
        imageStyle: z.string().min(1).max(64),
        customPrompt: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => generateAndStoreImage(data));

export const publishNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        topic: z.string().min(1).max(200),
        platform: z.enum(["linkedin", "instagram", "both"]),
        linkedinText: z.string().max(4000).optional(),
        instagramText: z.string().max(4000).optional(),
        imageUrl: z.string().url().optional(),
        imagePrompt: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const results: Array<{ platform: string; status: "success" | "failed"; error?: string }> = [];

    const wantLi = data.platform === "linkedin" || data.platform === "both";
    const wantIg = data.platform === "instagram" || data.platform === "both";

    if (wantLi) {
      try {
        if (!data.linkedinText) throw new Error("LinkedIn text required");
        const r = await publishToLinkedIn({ text: data.linkedinText, imageUrl: data.imageUrl });
        await supabaseAdmin.from("posts").insert({
          topic: data.topic,
          platform: "linkedin",
          status: "success",
          content: data.linkedinText,
          image_url: data.imageUrl ?? null,
          image_prompt: data.imagePrompt ?? null,
          external_id: r.externalId,
        });
        await supabaseAdmin.from("logs").insert({ level: "SUCCESS", message: `Manual LinkedIn post published: ${data.topic}` });
        results.push({ platform: "linkedin", status: "success" });
      } catch (e) {
        const msg = (e as Error).message;
        await supabaseAdmin.from("posts").insert({
          topic: data.topic,
          platform: "linkedin",
          status: "failed",
          content: data.linkedinText ?? "",
          image_url: data.imageUrl ?? null,
          error_msg: msg,
        });
        await supabaseAdmin.from("logs").insert({ level: "ERROR", message: `Manual LinkedIn failed: ${msg}` });
        results.push({ platform: "linkedin", status: "failed", error: msg });
      }
    }

    if (wantIg) {
      try {
        if (!data.instagramText) throw new Error("Instagram caption required");
        if (!data.imageUrl) throw new Error("Instagram requires an image");
        const r = await publishToInstagram({ caption: data.instagramText, imageUrl: data.imageUrl });
        await supabaseAdmin.from("posts").insert({
          topic: data.topic,
          platform: "instagram",
          status: "success",
          content: data.instagramText,
          image_url: data.imageUrl,
          image_prompt: data.imagePrompt ?? null,
          external_id: r.externalId,
        });
        await supabaseAdmin.from("logs").insert({ level: "SUCCESS", message: `Manual Instagram post published: ${data.topic}` });
        results.push({ platform: "instagram", status: "success" });
      } catch (e) {
        const msg = (e as Error).message;
        await supabaseAdmin.from("posts").insert({
          topic: data.topic,
          platform: "instagram",
          status: "failed",
          content: data.instagramText ?? "",
          image_url: data.imageUrl ?? null,
          error_msg: msg,
        });
        await supabaseAdmin.from("logs").insert({ level: "ERROR", message: `Manual Instagram failed: ${msg}` });
        results.push({ platform: "instagram", status: "failed", error: msg });
      }
    }

    return { results };
  });

export const runNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ topic: z.string().min(1).max(200).optional() }).parse(d ?? {}))
  .handler(async ({ data }) => runDailyWorkflow({ topic: data.topic }));
