import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, CalendarClock, CheckCircle2, Clock, Linkedin, Instagram,
  CircleDot, Play, Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { getDashboard, runNow } from "@/lib/workflow.functions";

export const Route = createFileRoute("/")({ component: Dashboard });

function nextRun(post_time: string, active_days: string[]): { label: string; sub: string } {
  if (!post_time) return { label: "—", sub: "Not scheduled" };
  const [h, m] = post_time.split(":").map(Number);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(h, m, 0, 0);
    if (d <= now) continue;
    if (!active_days.includes(days[d.getDay()])) continue;
    const ms = d.getTime() - now.getTime();
    const hrs = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return { label: `in ${hrs}h ${mins}m`, sub: format(d, "EEE h:mm a") };
  }
  return { label: "—", sub: "No active days" };
}

function Dashboard() {
  const getFn = useServerFn(getDashboard);
  const runFn = useServerFn(runNow);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getFn(),
    refetchInterval: 30_000,
  });

  const runMut = useMutation({
    mutationFn: () => runFn({ data: {} }),
    onSuccess: (r) => {
      const ok = r.results.filter((x) => x.status === "success").length;
      toast.success(`${ok}/${r.results.length} posts published`, { description: `Topic: ${r.topic}` });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  const nr = nextRun(data.settings.post_time, data.settings.active_days);
  const stats = [
    { label: "Posts Today", value: String(data.postsToday), trend: "Live", icon: TrendingUp, color: "text-info" },
    { label: "Posts This Week", value: String(data.postsThisWeek), trend: "Last 7 days", icon: CalendarClock, color: "text-primary" },
    { label: "Success Rate", value: `${data.successRate}%`, trend: "Last 30 days", icon: CheckCircle2, color: "text-success" },
    { label: "Next Run", value: nr.label, trend: nr.sub, icon: Clock, color: "text-warning" },
  ];

  const services = [
    { name: "Lovable AI", status: "ok" as const, detail: "Gemini 2.5 Flash + Nano Banana" },
    { name: "LinkedIn", status: data.settings.post_to_linkedin ? ("ok" as const) : ("error" as const), detail: data.settings.post_to_linkedin ? "Enabled" : "Disabled" },
    { name: "Instagram", status: data.settings.post_to_instagram ? ("ok" as const) : ("error" as const), detail: data.settings.post_to_instagram ? "Enabled" : "Disabled" },
    { name: "Scheduler", status: data.settings.schedule_enabled ? ("ok" as const) : ("error" as const), detail: `${data.settings.active_days.join(", ")} · ${data.settings.post_time}` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                  <div className="text-3xl font-semibold mt-2">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.trend}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-accent flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Activity</h2>
            <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {data.recent.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12">No posts yet. Click "Run Now" to publish your first.</div>
          ) : (
            <div className="space-y-2">
              {data.recent.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.platform === "linkedin" ? "bg-[#0A66C2]" : "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]"}`}>
                    {p.platform === "linkedin" ? <Linkedin className="w-4 h-4 text-white" /> : <Instagram className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{p.topic}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(p.posted_at), "MMM d, h:mm a")}</div>
                  </div>
                  <StatusBadge status={p.status as "success" | "failed" | "pending"} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">System Status</h2>
          <div className="space-y-3 mb-6">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.detail}</div>
                </div>
                <CircleDot className={`w-4 h-4 ${s.status === "ok" ? "text-success" : "text-muted-foreground"}`} />
              </div>
            ))}
          </div>
          {data.recent[0] && (
            <div className="text-xs text-muted-foreground mb-3">
              Last run: {formatDistanceToNow(new Date(data.recent[0].posted_at))} ago
            </div>
          )}
          <Button className="w-full gap-2 shadow-lg shadow-primary/20" disabled={runMut.isPending} onClick={() => runMut.mutate()}>
            {runMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
            {runMut.isPending ? "Running…" : "Run Automation Now"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "failed" | "pending" }) {
  const map = {
    success: { c: "bg-success/15 text-success border-success/30", l: "Success" },
    failed: { c: "bg-destructive/15 text-destructive border-destructive/30", l: "Failed" },
    pending: { c: "bg-warning/15 text-warning border-warning/30", l: "Pending" },
  } as const;
  const m = map[status];
  return <Badge variant="outline" className={`${m.c} font-medium gap-1`}><CircleDot className="w-2.5 h-2.5" />{m.l}</Badge>;
}
