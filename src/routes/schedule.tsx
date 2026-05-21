import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, GripVertical } from "lucide-react";
import { topicCategories } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/schedule")({ component: SchedulePage });

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SchedulePage() {
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState("09:00");
  const [tz, setTz] = useState("IST");
  const [activeDays, setActiveDays] = useState<string[]>(["Mon","Tue","Wed","Thu","Fri"]);

  const toggleDay = (d: string) =>
    setActiveDays((arr) => arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d]);

  return (
    <div className="space-y-6 max-w-3xl">
      {!enabled && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div className="text-sm">Automation is paused. No posts will be published automatically.</div>
        </div>
      )}

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Enable Daily Automation</div>
            <div className="text-sm text-muted-foreground">Master switch for all scheduled posting</div>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Post Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({length: 13}).map((_, i) => {
                  const h = 6 + Math.floor(i / 2); const m = (i % 2) * 30;
                  const v = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
                  return <SelectItem key={v} value={v}>{v}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Timezone</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["IST","UTC","EST","PST","GMT"].map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Days of week</Label>
          <div className="flex flex-wrap gap-2">
            {days.map(d => (
              <button key={d} onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${activeDays.includes(d) ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => toast.success("Schedule saved")}>Save Schedule</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="font-semibold">Content Rotation</div>
        <div className="flex items-center justify-between">
          <Label>Auto-select daily topic</Label>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label>Shuffle topics randomly</Label>
          <Switch />
        </div>
        <div>
          <Label className="mb-2 block">Topic rotation order</Label>
          <div className="space-y-1.5">
            {topicCategories.map((t) => (
              <div key={t} className="flex items-center gap-2 p-2 rounded-lg bg-accent/40">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="font-semibold">Posting Behavior</div>
        {[
          ["Post to LinkedIn", true],
          ["Post to Instagram", true],
          ["Generate new image daily", true],
          ["Use same image for both platforms", true],
        ].map(([label, def]) => (
          <div key={String(label)} className="flex items-center justify-between">
            <Label>{label as string}</Label>
            <Switch defaultChecked={def as boolean} />
          </div>
        ))}
        <div>
          <Label className="mb-1.5 block">Image style preference</Label>
          <Select defaultValue="Corporate Blue">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Corporate Blue", "Dark Tech", "Minimal White", "Vibrant Gradient"].map(s =>
                <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}
