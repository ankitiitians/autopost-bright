import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { topicCategories } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const defaults = {
  linkedin: `Write a professional LinkedIn post about {topic}.\nTone: {tone}.\nNo emojis.\nUse professional Unicode formatting with line breaks.\nEnd with 3-5 relevant hashtags.\nMaximum 1300 characters.`,
  instagram: `Write an engaging Instagram caption about {topic}.\nUse a conversational, trendy tone.\nInclude relevant emojis.\nEnd with 10-15 relevant hashtags.\nMaximum 2200 characters.`,
  image: `Create a professional social media image about {topic}.\nStyle: {imageStyle}.\nModern, minimal design.\nNo text overlay.\nHigh quality, 1:1 square format.`,
};

function SettingsPage() {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 space-y-4">
        <div className="font-semibold">General</div>
        <div>
          <Label className="mb-1.5 block">App name</Label>
          <Input defaultValue="AutoPost AI" />
        </div>
        <div>
          <Label className="mb-1.5 block">Default topic category</Label>
          <Select defaultValue="DevOps">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {topicCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block">Notification email (for automation failures)</Label>
          <Input type="email" placeholder="admin@example.com" />
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div className="font-semibold">AI Prompt Templates</div>
        {(["linkedin", "instagram", "image"] as const).map((key) => (
          <PromptTemplate key={key} label={`${key[0].toUpperCase()}${key.slice(1)} Prompt`} defaultValue={defaults[key]} />
        ))}
      </Card>

      <Card className="p-6 space-y-4 border-destructive/40">
        <div className="font-semibold text-destructive">Danger Zone</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-warning text-warning hover:text-warning" onClick={() => toast.message("Automation paused")}>
            Pause All Automation
          </Button>
          <Button variant="outline" className="border-destructive text-destructive hover:text-destructive" onClick={() => toast.message("All logs cleared")}>
            Clear All Logs
          </Button>
        </div>
        <div className="pt-3 border-t space-y-2">
          <Label>Reset all settings — type <span className="font-mono font-bold">RESET</span> to confirm</Label>
          <div className="flex gap-2">
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="RESET" />
            <Button variant="destructive" disabled={confirm !== "RESET"} onClick={() => { toast.success("Settings reset"); setConfirm(""); }}>
              Reset Everything
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PromptTemplate({ label, defaultValue }: { label: string; defaultValue: string }) {
  const [v, setV] = useState(defaultValue);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>{label}</Label>
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setV(defaultValue)}>Reset to default</Button>
      </div>
      <Textarea value={v} onChange={(e) => setV(e.target.value)} rows={6} className="font-mono text-xs" />
    </div>
  );
}
