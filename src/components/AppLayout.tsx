import { Link, useRouterState, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, Sparkles, CalendarClock, Link2, History,
  ScrollText, Settings, Zap, LogOut, Moon, Sun, Play, Menu, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { runNow } from "@/lib/workflow.functions";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/generate", label: "Generate", icon: Sparkles },
  { to: "/schedule", label: "Schedule", icon: CalendarClock },
  { to: "/accounts", label: "Accounts", icon: Link2 },
  { to: "/history", label: "History", icon: History },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/generate": "Content Generator",
  "/schedule": "Schedule Settings",
  "/accounts": "Connected Accounts",
  "/history": "Post History",
  "/logs": "Activity Logs",
  "/settings": "App Settings",
};

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const runFn = useServerFn(runNow);

  const runMut = useMutation({
    mutationFn: () => runFn({ data: {} }),
    onSuccess: (r) => {
      const ok = r.results.filter((x) => x.status === "success").length;
      toast.success(`Workflow complete — ${ok}/${r.results.length} posts published`, {
        description: `Topic: ${r.topic}`,
      });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className={cn("min-h-screen bg-background text-foreground flex")}>
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground w-60 shrink-0 flex flex-col border-r border-sidebar-border z-40",
          "fixed lg:sticky top-0 h-screen transition-transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-5 py-5 flex items-center gap-2 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="w-5 h-5 text-primary-foreground" fill="currentColor" />
          </div>
          <div>
            <div className="font-semibold text-base leading-tight">AutoPost AI</div>
            <div className="text-[11px] text-sidebar-foreground/60">Social automation</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-2">Signed in as</div>
          <div className="text-sm font-medium truncate mb-3">{user?.email ?? "—"}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/50 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">{titles[pathname] ?? "AutoPost AI"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button onClick={() => runMut.mutate()} disabled={runMut.isPending} className="gap-2 shadow-lg shadow-primary/20">
              {runMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
              {runMut.isPending ? "Running…" : "Run Now"}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
