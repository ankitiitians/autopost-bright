import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockLogs, type LogLevel } from "@/lib/mock-data";
import { format } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/logs")({ component: LogsPage });

const levelColors: Record<LogLevel, string> = {
  INFO: "text-info",
  SUCCESS: "text-success",
  ERROR: "text-destructive",
  WARNING: "text-warning",
};

function LogsPage() {
  const [filter, setFilter] = useState<string>("all");
  const visible = mockLogs.filter((l) => filter === "all" || l.level === filter);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
          </span>
          <span className="text-sm font-medium">Live</span>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="SUCCESS">SUCCESS</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
            <SelectItem value="WARNING">WARNING</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm"><Switch defaultChecked /> Auto-scroll</label>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Logs downloaded")}>
            <Download className="w-4 h-4 mr-1.5" /> Download
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => toast.message("Logs cleared")}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Clear
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="bg-sidebar text-sidebar-foreground font-mono text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
          {visible.map((l) => (
            <div key={l.id} className="px-4 py-1 flex gap-3 hover:bg-sidebar-accent/30 border-b border-sidebar-border/30">
              <span className="text-sidebar-foreground/50 whitespace-nowrap">
                [{format(l.timestamp, "yyyy-MM-dd HH:mm:ss")}]
              </span>
              <span className={`font-semibold w-16 ${levelColors[l.level]}`}>{l.level}</span>
              <span className="text-sidebar-foreground/90">{l.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
