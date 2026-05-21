import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Linkedin, Instagram, Search } from "lucide-react";
import { mockPosts, type Post } from "@/lib/mock-data";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Post | null>(null);

  const filtered = mockPosts.filter(p =>
    (platform === "all" || p.platform === platform) &&
    (status === "all" || p.status === status) &&
    (q === "" || p.topic.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <Select defaultValue="7"><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platform} onValueChange={setPlatform}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by topic" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-sm">{format(p.postedAt, "d MMM yyyy, h:mm a")}</TableCell>
                  <TableCell className="font-medium">{p.topic}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      {p.platform === "linkedin" ? <Linkedin className="w-4 h-4 text-[#0A66C2]" /> : <Instagram className="w-4 h-4 text-pink-500" />}
                      <span className="capitalize">{p.platform}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.status === "success" ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{p.content.slice(0, 80)}…</TableCell>
                  <TableCell>{p.imageUrl && <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover" />}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>View</Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.success("Re-posting…")}>Re-post</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.message("Deleted")}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between p-3 border-t text-sm">
          <div className="text-muted-foreground">Showing 1–{filtered.length} of {filtered.length} posts</div>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled>Previous</Button><Button size="sm" variant="outline" disabled>Next</Button></div>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.topic}</DialogTitle></DialogHeader>
              <div className="text-xs text-muted-foreground capitalize">
                {selected.platform} · {format(selected.postedAt, "PPpp")} · {selected.status}
              </div>
              {selected.imageUrl && <img src={selected.imageUrl} className="w-full rounded-lg" alt="" />}
              <div className="text-sm whitespace-pre-wrap">{selected.content}</div>
              {selected.errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{selected.errorMsg}</div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
