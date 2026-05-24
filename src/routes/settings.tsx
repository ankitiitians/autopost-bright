import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getSettings, updateSettings, clearLogs } from "@/lib/workflow.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const categories = ["DevOps", "AI / ML", "Cloud", "Productivity", "Leadership", "Startups", "Web Development"];

function SettingsPage() {
  const getFn = useServerFn(getSettings);
  const upFn = useServerFn(updateSettings);
  const clearFn = useServerFn(clearLogs);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: () => getFn() });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: (payload: any) => upFn({ data: payload }),
    onSuccess: () => { toast.success("Settings saved"); qc.invalidateQueries({ queryKey: ["settings"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <div className="flex items-center justify-center p-12"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 space-y-4">
        <div className="font-semibold">General</div>
        <div>
          <Label className="mb-1.5 block">App name</Label>
          <Input value={form.app_name} onChange={(e) => set("app_name", e.target.value)} />
        </div>
        <div>
          <Label className="mb-1.5 block">Default topic category</Label>
          <Select value={form.default_category} onValueChange={(v) => set("default_category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Notification email</Label>
          <Input type="email" value={form.notification_email ?? ""} onChange={(e) => set("notification_email", e.target.value || null)} />
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="font-semibold">Schedule</div>
        <label className="flex items-center justify-between text-sm">
          <span>Enable scheduled posting</span>
          <Switch checked={form.schedule_enabled} onCheckedChange={(v) => set("schedule_enabled", v)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">Post time (HH:MM)</Label>
            <Input value={form.post_time} onChange={(e) => set("post_time", e.target.value)} placeholder="09:00" />
          </div>
          <div>
            <Label className="mb-1.5 block">Timezone</Label>
            <Input value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">Active days</Label>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
              const on = form.active_days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("active_days", on ? form.active_days.filter((x: string) => x !== d) : [...form.active_days, d])}
                  className={`px-3 py-1.5 rounded-md text-sm border ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                >{d}</button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between text-sm border rounded-md p-3">
            <span>Post to LinkedIn</span>
            <Switch checked={form.post_to_linkedin} onCheckedChange={(v) => set("post_to_linkedin", v)} />
          </label>
          <label className="flex items-center justify-between text-sm border rounded-md p-3">
            <span>Post to Instagram</span>
            <Switch checked={form.post_to_instagram} onCheckedChange={(v) => set("post_to_instagram", v)} />
          </label>
        </div>
        <div>
          <Label className="mb-1.5 block">Default tone</Label>
          <Select value={form.default_tone} onValueChange={(v) => set("default_tone", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Authoritative", "Educational", "Inspirational"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Default image style</Label>
          <Select value={form.default_image_style} onValueChange={(v) => set("default_image_style", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Corporate Blue", "Dark Tech", "Minimal White", "Vibrant Gradient"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div className="font-semibold">AI Prompt Templates</div>
        <div>
          <Label className="mb-1.5 block">LinkedIn Prompt (vars: {`{topic}`} {`{tone}`})</Label>
          <Textarea rows={6} value={form.linkedin_prompt} onChange={(e) => set("linkedin_prompt", e.target.value)} className="font-mono text-xs" />
        </div>
        <div>
          <Label className="mb-1.5 block">Instagram Prompt (vars: {`{topic}`})</Label>
          <Textarea rows={6} value={form.instagram_prompt} onChange={(e) => set("instagram_prompt", e.target.value)} className="font-mono text-xs" />
        </div>
        <div>
          <Label className="mb-1.5 block">Image Prompt (vars: {`{topic}`} {`{imageStyle}`})</Label>
          <Textarea rows={6} value={form.image_prompt} onChange={(e) => set("image_prompt", e.target.value)} className="font-mono text-xs" />
        </div>
      </Card>

      <div className="flex gap-2">
        <Button disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
        <Button variant="outline" onClick={() => setForm(data)}>Reset</Button>
      </div>

      <Card className="p-6 space-y-4 border-destructive/40">
        <div className="font-semibold text-destructive">Danger Zone</div>
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:text-destructive"
          onClick={async () => { await clearFn(); toast.success("Logs cleared"); qc.invalidateQueries({ queryKey: ["logs"] }); }}
        >
          Clear All Logs
        </Button>
      </Card>
    </div>
  );
}
