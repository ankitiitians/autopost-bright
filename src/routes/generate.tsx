import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles, Image as ImageIcon, RefreshCw, Linkedin, Instagram,
  Send, Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Repeat2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { generateLinkedIn, generateInstagram, generateImageFn, publishNow } from "@/lib/workflow.functions";

export const Route = createFileRoute("/generate")({ component: GeneratePage });

const categories = ["DevOps", "AI / ML", "Cloud", "Productivity", "Leadership", "Startups", "Web Development"];
const styles = ["Corporate Blue", "Dark Tech", "Minimal White", "Vibrant Gradient"];

function GeneratePage() {
  const [topic, setTopic] = useState("Kubernetes automation");
  const [category, setCategory] = useState("DevOps");
  const [tone, setTone] = useState("Educational");
  const [liText, setLiText] = useState("");
  const [igText, setIgText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageStyle, setImageStyle] = useState("Corporate Blue");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const qc = useQueryClient();
  const liFn = useServerFn(generateLinkedIn);
  const igFn = useServerFn(generateInstagram);
  const imgFn = useServerFn(generateImageFn);
  const pubFn = useServerFn(publishNow);

  const liMut = useMutation({
    mutationFn: () => liFn({ data: { topic, tone } }),
    onSuccess: (r) => setLiText(r.text),
    onError: (e: Error) => toast.error(e.message),
  });
  const igMut = useMutation({
    mutationFn: () => igFn({ data: { topic } }),
    onSuccess: (r) => setIgText(r.text),
    onError: (e: Error) => toast.error(e.message),
  });
  const imgMut = useMutation({
    mutationFn: () => imgFn({ data: { topic, imageStyle, customPrompt: useCustomPrompt ? customPrompt : undefined } }),
    onSuccess: (r) => setImageUrl(r.url),
    onError: (e: Error) => toast.error(e.message),
  });
  const pubMut = useMutation({
    mutationFn: (platform: "linkedin" | "instagram" | "both") =>
      pubFn({
        data: {
          topic, platform,
          linkedinText: liText || undefined,
          instagramText: igText || undefined,
          imageUrl: imageUrl || undefined,
        },
      }),
    onSuccess: (r) => {
      const ok = r.results.filter((x) => x.status === "success").length;
      toast.success(`Published ${ok}/${r.results.length}`);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6">
      <div className="space-y-5">
        <Card className="p-6 space-y-4">
          <SectionTitle icon={<Sparkles className="w-4 h-4" />}>Topic</SectionTitle>
          <div>
            <Label className="mb-1.5 block">Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Kubernetes automation" />
          </div>
          <div>
            <Label className="mb-1.5 block">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle icon={<Linkedin className="w-4 h-4 text-[#0A66C2]" />}>LinkedIn Post</SectionTitle>
          <div className="space-y-2">
            <Label>Tone</Label>
            <RadioGroup value={tone} onValueChange={setTone} className="flex gap-4">
              {["Authoritative", "Educational", "Inspirational"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value={t} /> {t}
                </label>
              ))}
            </RadioGroup>
          </div>
          <Button onClick={() => liMut.mutate()} disabled={liMut.isPending} className="w-full gap-2">
            {liMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {liMut.isPending ? "Generating..." : "Generate LinkedIn Post"}
          </Button>
          {liMut.isPending ? (
            <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
          ) : liText && (
            <>
              <Textarea value={liText} onChange={(e) => setLiText(e.target.value)} rows={8} className="font-mono text-sm" />
              <div className="text-xs text-muted-foreground text-right">{liText.length} characters</div>
            </>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle icon={<Instagram className="w-4 h-4 text-pink-500" />}>Instagram Caption</SectionTitle>
          <Button onClick={() => igMut.mutate()} disabled={igMut.isPending} className="w-full gap-2">
            {igMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {igMut.isPending ? "Generating..." : "Generate Instagram Caption"}
          </Button>
          {igMut.isPending ? (
            <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4 w-4/5" /></div>
          ) : igText && (
            <>
              <Textarea value={igText} onChange={(e) => setIgText(e.target.value)} rows={7} className="font-mono text-sm" />
              <div className="text-xs text-muted-foreground text-right">{igText.length} characters</div>
            </>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle icon={<ImageIcon className="w-4 h-4 text-teal-500" />}>AI Image</SectionTitle>
          <label className="flex items-center justify-between text-sm">
            <span>Use a custom image prompt</span>
            <Switch checked={useCustomPrompt} onCheckedChange={setUseCustomPrompt} />
          </label>
          {useCustomPrompt ? (
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              placeholder="Describe exactly the image you want… (e.g. 'Isometric illustration of a server rack with glowing blue cables, dark navy background, minimal')"
              className="font-mono text-sm"
            />
          ) : (
            <Select value={imageStyle} onValueChange={setImageStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{styles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button
            onClick={() => imgMut.mutate()}
            disabled={imgMut.isPending || (useCustomPrompt && customPrompt.trim().length === 0)}
            className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {imgMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            {imgMut.isPending ? "Generating image..." : "Generate Image"}
          </Button>
          {imgMut.isPending && <div className="w-full aspect-square rounded-xl bg-muted animate-pulse" />}
          {!imgMut.isPending && imageUrl && (
            <>
              <img src={imageUrl} alt="Generated" className="w-full max-w-[400px] rounded-xl border" />
              <Button variant="outline" onClick={() => imgMut.mutate()} className="gap-2"><RefreshCw className="w-4 h-4" /> Regenerate</Button>
            </>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <SectionTitle icon={<Send className="w-4 h-4" />}>Publish</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white gap-2"
              disabled={pubMut.isPending || !liText}
              onClick={() => pubMut.mutate("linkedin")}
            ><Linkedin className="w-4 h-4" /> Post to LinkedIn</Button>
            <Button
              className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white gap-2"
              disabled={pubMut.isPending || !igText || !imageUrl}
              onClick={() => pubMut.mutate("instagram")}
            ><Instagram className="w-4 h-4" /> Post to Instagram</Button>
            <Button
              className="gap-2 sm:col-span-2"
              disabled={pubMut.isPending || (!liText && !igText)}
              onClick={() => pubMut.mutate("both")}
            >
              {pubMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post to Both
            </Button>
          </div>
        </Card>
      </div>

      {/* Preview */}
      <div className="xl:sticky xl:top-24 xl:self-start">
        <Tabs defaultValue="linkedin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="linkedin"><Linkedin className="w-4 h-4 mr-1.5" /> LinkedIn</TabsTrigger>
            <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-1.5" /> Instagram</TabsTrigger>
          </TabsList>
          <TabsContent value="linkedin">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div>
                  <div className="font-semibold text-sm">Your Name</div>
                  <div className="text-xs text-muted-foreground">Senior Engineer · Just now</div>
                </div>
              </div>
              <div className="px-4 pb-3 text-sm whitespace-pre-wrap min-h-[60px]">
                {liText || <span className="text-muted-foreground italic">Generate a LinkedIn post to see preview…</span>}
              </div>
              {imageUrl && <img src={imageUrl} alt="" className="w-full" />}
              <div className="flex items-center justify-around py-2 border-t text-muted-foreground text-xs">
                <button className="flex items-center gap-1.5 p-2"><ThumbsUp className="w-4 h-4" /> Like</button>
                <button className="flex items-center gap-1.5 p-2"><MessageCircle className="w-4 h-4" /> Comment</button>
                <button className="flex items-center gap-1.5 p-2"><Repeat2 className="w-4 h-4" /> Repost</button>
                <button className="flex items-center gap-1.5 p-2"><Send className="w-4 h-4" /> Send</button>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="instagram">
            <Card className="p-0 overflow-hidden">
              <div className="p-3 flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-0.5">
                  <div className="w-full h-full rounded-full bg-card" />
                </div>
                <div className="flex-1"><div className="font-semibold text-sm">your.handle</div></div>
              </div>
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-muted" />
              )}
              <div className="flex items-center gap-4 p-3">
                <Heart className="w-6 h-6" />
                <MessageCircle className="w-6 h-6" />
                <Share2 className="w-6 h-6" />
                <Bookmark className="w-6 h-6 ml-auto" />
              </div>
              <div className="px-3 pb-4 text-sm whitespace-pre-wrap min-h-[60px]">
                {igText ? (
                  <><span className="font-semibold">your.handle</span> {igText}</>
                ) : <span className="text-muted-foreground italic">Generate a caption to see preview…</span>}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return <div className="flex items-center gap-2 font-semibold">{icon} {children}</div>;
}
