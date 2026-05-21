import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Linkedin, Instagram, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/accounts")({ component: AccountsPage });

function AccountsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      <AccountCard
        title="LinkedIn"
        icon={<Linkedin className="w-5 h-5 text-[#0A66C2]" />}
        connected={false}
        instructions={[
          "Go to LinkedIn Developer Portal",
          "Create an application",
          "Add OAuth 2.0 redirect URI",
          "Copy your Client ID and Client Secret",
          "Paste them below and click Authorize",
        ]}
        fields={["Client ID", "Client Secret", "Access Token"]}
      />
      <AccountCard
        title="Instagram Business"
        icon={<Instagram className="w-5 h-5 text-pink-500" />}
        connected={false}
        instructions={[
          "Ensure you have an Instagram Business Account",
          "Connect it to a Facebook Page",
          "Create a Meta Developer App",
          "Generate a long-lived access token",
          "Paste your Access Token and Instagram Business Account ID below",
        ]}
        fields={["Meta Access Token", "Instagram Business Account ID"]}
      />
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="font-semibold">OpenAI API</div>
              <div className="text-xs text-muted-foreground">GPT-4o + DALL·E 3</div>
            </div>
          </div>
          <Badge className="bg-success/15 text-success border-success/30" variant="outline">Configured</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-3">
          <Input defaultValue="sk-•••••••••••••••••••••••••••••••••••aB2c" readOnly />
          <Button variant="outline" onClick={() => toast.success("Open API key updated")}>Update API Key</Button>
        </div>
        <div className="text-sm text-muted-foreground">Monthly usage estimate: <span className="font-semibold text-foreground">~₹2,400</span></div>
      </Card>
    </div>
  );
}

function AccountCard({
  title, icon, connected, instructions, fields,
}: {
  title: string; icon: React.ReactNode; connected: boolean;
  instructions: string[]; fields: string[];
}) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div className="font-semibold">{title}</div>
        </div>
        {connected
          ? <Badge variant="outline" className="bg-success/15 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</Badge>
          : <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" /> Not Connected</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">
        Connect your {title} account to publish content automatically.
      </p>
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild><Button>Connect {title}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Connect {title}</DialogTitle></DialogHeader>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
              {instructions.map((s) => <li key={s}>{s}</li>)}
            </ol>
            <div className="space-y-3 pt-2">
              {fields.map((f) => (
                <div key={f}>
                  <Label className="mb-1.5 block">{f}</Label>
                  <Input placeholder={f} />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => toast.success(`${title} connected (demo)`)}>Authorize</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={() => toast.info("Test connection — demo")}>Test Connection</Button>
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => toast.message("Disconnected")}>Disconnect</Button>
      </div>
    </Card>
  );
}
