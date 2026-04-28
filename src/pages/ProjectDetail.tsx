import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { Button } from "@/components/ui/button";
import { StatusPill, KindPill, PriorityChip } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fmtDateLong, fmtDate, daysBetween, reasonLabel } from "@/lib/format";
import { Pencil, Calendar, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DelayReason } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = usePlan();
  const project = state.projects.find((p) => p.id === id);

  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState(project?.newDate.slice(0, 10) ?? "");
  const [reason, setReason] = useState<DelayReason>("estimation");

  if (!project) return <div className="container px-6 py-10">Project not found.</div>;

  const slipped = daysBetween(project.targetDate, project.newDate);
  const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("");

  const submitDelivery = () => {
    if (!newDate) { toast.error("Pick a date"); return; }
    dispatch({ type: "UPDATE_DELIVERY", projectId: project.id, newDate: new Date(newDate).toISOString(), reason, actor: "Neha Verma" });
    toast.success("Delivery date updated");
    setOpen(false);
  };

  return (
    <div className="container max-w-[1100px] space-y-6 px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{project.name}</h1>
            <PriorityChip priority={project.priority} />
            <KindPill kind={project.kind} />
            <StatusPill status={project.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{project.successMetric}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)} className="gap-1.5"><Pencil className="h-4 w-4" /> Edit</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Calendar className="h-4 w-4" /> Update Delivery</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Update Delivery Date</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Original</Label>
                  <p className="mt-1 font-mono-num text-sm">{fmtDateLong(project.targetDate)}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">New delivery date</Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reason</Label>
                  <Select value={reason} onValueChange={(v) => setReason(v as DelayReason)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scope_change">Scope change</SelectItem>
                      <SelectItem value="tech_feasibility">Tech feasibility</SelectItem>
                      <SelectItem value="estimation">Estimation increase</SelectItem>
                      <SelectItem value="adhoc">Ad-hoc project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submitDelivery}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owners</p>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2.5"><Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary text-[10px]">{initials(project.businessPoc || "—")}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{project.businessPoc || "—"}</p><p className="text-[11px] text-muted-foreground">Business POC</p></div></div>
            <div className="flex items-center gap-2.5"><Avatar className="h-8 w-8"><AvatarFallback className="bg-secondary text-[10px]">{initials(project.productPoc)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{project.productPoc}</p><p className="text-[11px] text-muted-foreground">Product POC</p></div></div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Original</span><span className="font-mono-num">{fmtDate(project.targetDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current</span><span className={cn("font-mono-num font-medium", slipped > 0 && "text-status-high")}>{fmtDate(project.newDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delta</span><span className={cn("font-mono-num font-bold", slipped > 0 ? "text-status-high" : "text-status-on-track")}>{slipped > 0 ? `+${slipped}d` : "on time"}</span></div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resources (E / T / D)</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(["E","T","D"] as const).map((k) => (
              <div key={k} className="rounded-lg border bg-secondary/30 p-2">
                <p className="text-[10px] text-muted-foreground">{k}</p>
                <p className="font-mono-num text-lg font-semibold">{project.currentResources[k]}<span className="text-xs text-muted-foreground">/{project.plannedResources[k]}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold">Delivery History</h3>
        {project.deliveryHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No date changes yet — on the original plan.</p>
        ) : (
          <div className="space-y-2">
            {project.deliveryHistory.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3 text-xs">
                <span className="font-mono-num text-muted-foreground line-through">{fmtDate(h.fromDate)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-status-adhoc" />
                <span className="font-mono-num font-semibold">{fmtDate(h.toDate)}</span>
                <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium">{reasonLabel[h.reason]}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{h.actor} · {fmtDate(h.timestamp)}</span>
                {h.requestId && <Link to={`/requests/${h.requestId}`} className="text-[10px] text-accent underline">view request</Link>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
