import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Wand2, Image as ImageIcon, RefreshCw, Linkedin, Instagram,
  Send, Heart, MessageCircle, Share2, Bookmark, ThumbsUp, Repeat2,
  CalendarPlus,
} from "lucide-react";
import { topicCategories, suggestTopic, genLinkedIn, genInstagram } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/generate")({ component: GeneratePage });

function GeneratePage() {
  const [topic, setTopic] = useState("Kubernetes automation");
  const [category, setCategory] = useState("DevOps");
  const [tone, setTone] = useState("Educational");
  const [liHashtags, setLiHashtags] = useState(true);
  const [liEmojis, setLiEmojis] = useState(false);
  const [igHashtags, setIgHashtags] = useState(true);
  const [igEmojis, setIgEmojis] = useState(true);
  const [liText, setLiText] = useState("");
  const [igText, setIgText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageStyle, setImageStyle] = useState("Corporate Blue");
  const [genLi, setGenLi] = useState(false);
  const [genIg, setGenIg] = useState(false);
  const [genImg, setGenImg] = useState(false);

  const doGenLi = () => {
    setGenLi(true);
    setTimeout(() => { setLiText(genLinkedIn(topic, tone)); setGenLi(false); }, 1200);
  };
  const doGenIg = () => {
    setGenIg(true);
    setTimeout(() => { setIgText(genInstagram(topic)); setGenIg(false); }, 1200);
  };
  const doGenImg = () => {
    setGenImg(true);
    setTimeout(() => {
      setImageUrl(`https://picsum.photos/seed/${encodeURIComponent(topic + imageStyle)}/600/600`);
      setGenImg(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6">
      {/* Controls */}
      <div className="space-y-5">
        <Card className="p-6 space-y-4">
          <SectionTitle icon={<Sparkles className="w-4 h-4" />}>Topic</SectionTitle>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Today's Topic</Label>
              <div className="flex gap-2">
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Kubernetes automation" />
                <Button variant="outline" onClick={() => setTopic(suggestTopic())} className="gap-1.5 shrink-0">
                  <Wand2 className="w-4 h-4" /> Suggest
                </Button>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {topicCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle icon={<Linkedin className="w-4 h-4 text-[#0A66C2]" />}>LinkedIn Post</SectionTitle>
          <Button onClick={doGenLi} disabled={genLi} className="w-full gap-2">
            <Sparkles className="w-4 h-4" /> {genLi ? "Generating..." : "Generate LinkedIn Post"}
          </Button>
          {genLi ? (
            <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
          ) : liText && (
            <>
              <Textarea value={liText} onChange={(e) => setLiText(e.target.value)} rows={8} className="font-mono text-sm" />
              <div className="text-xs text-muted-foreground text-right">{liText.length} characters</div>
            </>
          )}
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
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={liHashtags} onCheckedChange={(v) => setLiHashtags(!!v)} /> Include hashtags
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={liEmojis} onCheckedChange={(v) => setLiEmojis(!!v)} /> Include emojis
            </label>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle icon={<Instagram className="w-4 h-4 text-pink-500" />}>Instagram Caption</SectionTitle>
          <Button onClick={doGenIg} disabled={genIg} className="w-full gap-2">
            <Sparkles className="w-4 h-4" /> {genIg ? "Generating..." : "Generate Instagram Caption"}
          </Button>
          {genIg ? (
            <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/4" /></div>
          ) : igText && (
            <>
              <Textarea value={igText} onChange={(e) => setIgText(e.target.value)} rows={7} className="font-mono text-sm" />
              <div className="text-xs text-muted-foreground text-right">{igText.length} characters</div>
            </>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={igHashtags} onCheckedChange={(v) => setIgHashtags(!!v)} /> Include hashtags
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={igEmojis} onCheckedChange={(v) => setIgEmojis(!!v)} /> Include emojis
            </label>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <SectionTitle icon={<ImageIcon className="w-4 h-4 text-teal-500" />}>AI Image</SectionTitle>
          <Select value={imageStyle} onValueChange={setImageStyle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["Corporate Blue", "Dark Tech", "Minimal White", "Vibrant Gradient"].map((s) =>
                <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={doGenImg} disabled={genImg} className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white">
            <ImageIcon className="w-4 h-4" /> {genImg ? "Generating image..." : "Generate Image"}
          </Button>
          {genImg && <div className="w-full aspect-square rounded-xl bg-muted animate-pulse flex items-center justify-center text-muted-foreground text-sm">Generating image...</div>}
          {!genImg && imageUrl && (
            <>
              <img src={imageUrl} alt="Generated" className="w-full max-w-[400px] rounded-xl border" />
              <Button variant="outline" onClick={doGenImg} className="gap-2"><RefreshCw className="w-4 h-4" /> Regenerate</Button>
            </>
          )}
        </Card>

        <Card className="p-6 space-y-3">
          <SectionTitle icon={<Send className="w-4 h-4" />}>Publish</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white gap-2" onClick={() => toast.success("Posted to LinkedIn (demo)")}>
              <Linkedin className="w-4 h-4" /> Post to LinkedIn
            </Button>
            <Button className="bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-90 text-white gap-2" onClick={() => toast.success("Posted to Instagram (demo)")}>
              <Instagram className="w-4 h-4" /> Post to Instagram
            </Button>
            <Button className="gap-2 sm:col-span-2" onClick={() => toast.success("Posted to both platforms (demo)")}>
              <Send className="w-4 h-4" /> Post to Both
            </Button>
            <Button variant="outline" className="gap-2 sm:col-span-2" onClick={() => toast.info("Scheduled for tomorrow 9:00 AM")}>
              <CalendarPlus className="w-4 h-4" /> Schedule for Tomorrow 9 AM
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
                <div className="flex-1">
                  <div className="font-semibold text-sm">your.handle</div>
                </div>
                <Button size="sm" variant="ghost" className="text-info text-xs h-7">Follow</Button>
              </div>
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-muted grid grid-cols-3 grid-rows-3 gap-px">
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-background/40" />)}
                </div>
              )}
              <div className="flex items-center gap-4 p-3">
                <Heart className="w-6 h-6" />
                <MessageCircle className="w-6 h-6" />
                <Share2 className="w-6 h-6" />
                <Bookmark className="w-6 h-6 ml-auto" />
              </div>
              <div className="px-3 pb-1 text-sm font-semibold">1,284 likes</div>
              <div className="px-3 pb-4 text-sm whitespace-pre-wrap min-h-[60px]">
                {igText ? (
                  <><span className="font-semibold">your.handle</span> {igText.split(/(#\w+)/g).map((part, i) =>
                    part.startsWith("#") ? <span key={i} className="text-info">{part}</span> : <span key={i}>{part}</span>)}</>
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
