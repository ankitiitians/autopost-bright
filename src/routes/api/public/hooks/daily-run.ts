import { createFileRoute } from "@tanstack/react-router";
import { runDailyWorkflow } from "@/lib/workflow.server";

/**
 * Public cron endpoint. Called by pg_cron with an `apikey` header
 * matching the project's anon key. The day-of-week / schedule_enabled
 * gate is enforced inside the handler.
 */
export const Route = createFileRoute("/api/public/hooks/daily-run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: settings } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
          if (!settings?.schedule_enabled) {
            return Response.json({ skipped: "automation disabled" });
          }
          const tz = settings.timezone || "UTC";
          const now = new Date();
          const dayShort = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz }).format(now);
          if (!settings.active_days.includes(dayShort)) {
            return Response.json({ skipped: `inactive day: ${dayShort}` });
          }
          // Match HH:MM in the configured timezone (cron fires every 15 min)
          const hm = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
          }).format(now);
          const [sh, sm] = settings.post_time.split(":").map(Number);
          const [ch, cm] = hm.split(":").map(Number);
          const diff = Math.abs((ch * 60 + cm) - (sh * 60 + sm));
          // Manual triggers (no scheduled flag) skip the time window; cron sends body { scheduled: true }.
          const body = await request.json().catch(() => ({}));
          if (body?.scheduled && diff > 10) {
            return Response.json({ skipped: `outside window (now ${hm}, target ${settings.post_time} ${tz})` });
          }
          const result = await runDailyWorkflow();
          return Response.json(result);
        } catch (e) {
          console.error("daily-run error", e);
          return new Response(`Error: ${(e as Error).message}`, { status: 500 });
        }
      },
    },
  },
});
