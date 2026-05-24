import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Linkedin, Instagram, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { listPosts, deletePost } from "@/lib/workflow.functions";

export const Route = createFileRoute("/history")({ component: HistoryPage });

type Post = {
  id: string;
  topic: string;
  platform: string;
  status: string;
  content: string;
  image_url: string | null;
  error_msg: string | null;
  posted_at: string;
};

function HistoryPage() {
  const listFn = useServerFn(listPosts);
  const delFn = useServerFn(deletePost);
  const qc = useQueryClient();
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Post | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => listFn(),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["posts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((p) =>
    (platform === "all" || p.platform === platform) &&
    (status === "all" || p.status === status) &&
    (q === "" || p.topic.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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
              {isLoading && (
                <TableRow><TableCell colSpan={7}><Skeleton className="h-8" /></TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No posts yet</TableCell></TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap text-sm">{format(new Date(p.posted_at), "d MMM yyyy, h:mm a")}</TableCell>
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
                  <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{(p.content ?? "").slice(0, 80)}…</TableCell>
                  <TableCell>{p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-md object-cover" />}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(p as Post)}>View</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => delMut.mutate(p.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-3 border-t text-sm text-muted-foreground">{filtered.length} post(s)</div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.topic}</DialogTitle></DialogHeader>
              <div className="text-xs text-muted-foreground capitalize">
                {selected.platform} · {format(new Date(selected.posted_at), "PPpp")} · {selected.status}
              </div>
              {selected.image_url && <img src={selected.image_url} className="w-full rounded-lg" alt="" />}
              <div className="text-sm whitespace-pre-wrap">{selected.content}</div>
              {selected.error_msg && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{selected.error_msg}</div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
