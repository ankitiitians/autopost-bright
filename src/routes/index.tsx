import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, CalendarClock, CheckCircle2, Clock, Linkedin, Instagram,
  XCircle, CircleDot, Play, AlertCircle,
} from "lucide-react";
import { mockPosts } from "@/lib/mock-data";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Dashboard });

const stats = [
  { label: "Posts Today", value: "2", trend: "+1 vs yesterday", icon: TrendingUp, color: "text-info" },
  { label: "Posts This Week", value: "12", trend: "+18% vs last week", icon: CalendarClock, color: "text-primary" },
  { label: "Success Rate", value: "98.2%", trend: "Last 30 days", icon: CheckCircle2, color: "text-success" },
  { label: "Next Run", value: "in 6h 32m", trend: "Tomorrow 9:00 AM IST", icon: Clock, color: "text-warning" },
];

const services = [
  { name: "OpenAI API", status: "ok", detail: "GPT-4o + DALL·E 3" },
  { name: "LinkedIn Account", status: "error", detail: "Not configured" },
  { name: "Instagram Account", status: "error", detail: "Not configured" },
  { name: "Scheduler", status: "ok", detail: "Active — Mon–Fri 9:00 AM" },
];

function Dashboard() {
  const recent = mockPosts.slice(0, 10);
  return (
    <div className="space-y-6">
      {/* Stats */}
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
        {/* Recent activity */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Activity</h2>
            <Link to="/history" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.platform === "linkedin" ? "bg-[#0A66C2]" : "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]"}`}>
                  {p.platform === "linkedin" ? <Linkedin className="w-4 h-4 text-white" /> : <Instagram className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.topic}</div>
                  <div className="text-xs text-muted-foreground">{format(p.postedAt, "MMM d, h:mm a")}</div>
                </div>
                <StatusBadge status={p.status} />
                <Button variant="ghost" size="sm" className="text-xs">View</Button>
              </div>
            ))}
          </div>
        </Card>

        {/* System status */}
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">System Status</h2>
          <div className="space-y-3 mb-6">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.detail}</div>
                </div>
                {s.status === "ok"
                  ? <CheckCircle2 className="w-5 h-5 text-success" />
                  : <XCircle className="w-5 h-5 text-destructive" />}
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            Last successful run: {formatDistanceToNow(mockPosts[0].postedAt)} ago
          </div>
          <Button
            className="w-full gap-2 shadow-lg shadow-primary/20"
            onClick={() => toast.info("Automation started")}
          >
            <Play className="w-4 h-4" fill="currentColor" /> Run Automation Now
          </Button>
          <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex gap-2">
            <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              Connect your LinkedIn and Instagram accounts to start publishing automatically.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "failed" | "pending" | "running" }) {
  const map = {
    success: { c: "bg-success/15 text-success border-success/30", l: "Success" },
    failed: { c: "bg-destructive/15 text-destructive border-destructive/30", l: "Failed" },
    pending: { c: "bg-warning/15 text-warning border-warning/30", l: "Pending" },
    running: { c: "bg-info/15 text-info border-info/30", l: "Running" },
  } as const;
  const m = map[status];
  return <Badge variant="outline" className={`${m.c} font-medium gap-1`}><CircleDot className="w-2.5 h-2.5" />{m.l}</Badge>;
}
