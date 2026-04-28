import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { UrgencyPill, RequestStatusPill } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Counter } from "@/components/Counter";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Check, X, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const useCountdown = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  const hours = Math.max(0, Math.floor(ms / 3600000));
  const days = Math.floor(hours / 24);
  return { days, hours: hours % 24, expired: ms <= 0 };
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = usePlan();
  const req = state.requests.find((r) => r.id === id);
  const [comment, setComment] = useState("");
  const [pulse, setPulse] = useState(false);
  const cd = useCountdown(req?.decisionDeadline ?? new Date().toISOString());

  const impacts = useMemo(() => {
    if (!req) return [];
    return req.impacts.map((i) => {
      const project = state.projects.find((p) => p.id === i.projectId)!;
      return { project, oldDate: project.newDate, projectedDate: i.newDate, delta: i.delayDays };
    }).filter((x) => x.project);
  }, [state.projects, req]);

  if (!req) return <div className="container px-6 py-10">Request not found.</div>;

  const totalDelay = impacts.reduce((s, i) => s + i.delta, 0);
  const avgDelay = impacts.length ? Math.round(totalDelay / impacts.length) : 0;

  const decide = (decision: "approved" | "rejected") => {
    dispatch({ type: "DECIDE", requestId: req.id, decision, comment: comment || undefined, actor: "Neha Verma" });
    setPulse(true);
    if (decision === "approved") {
      toast.success(`Approved · ${impacts.length} project(s) shifted`, { description: req.title });
    } else {
      toast.error(`Rejected`, { description: req.title });
    }
    setTimeout(() => navigate("/requests"), 800);
  };

  return (
    <div className="container max-w-[1300px] space-y-6 px-6 py-6">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-status-adhoc-soft to-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11 border-2 border-background shadow">
            <AvatarFallback className="bg-gradient-to-br from-accent to-status-adhoc text-sm text-white">
              {req.requestedBy.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-semibold tracking-tight">{req.title}</h1>
              <UrgencyPill urgency={req.urgency} />
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{req.category}</span>
              <RequestStatusPill status={req.status} />
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{req.description}</p>
            {req.successMetric && <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Metric:</span> {req.successMetric}</p>}
            <p className="mt-2 text-[11px] text-muted-foreground">Requested by {req.requestedBy} · {fmtDateTime(req.createdAt)} · target {fmtDate(req.targetDate)}</p>
          </div>
          {req.status === "awaiting_reply" && (
            <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs glass">
              <Clock className="h-3.5 w-3.5 text-status-slight" />
              <span className="font-mono-num font-semibold">
                {cd.expired ? "Overdue" : `${cd.days}d ${cd.hours}h`}
              </span>
              <span className="text-muted-foreground">to decide</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resources Requested</h2>
          {(["E", "T", "D"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between rounded-lg border bg-secondary/40 px-3 py-2">
              <span className="text-sm font-medium">{k === "E" ? "Engineers" : k === "T" ? "Testers" : "Designers"}</span>
              <span className="font-mono-num text-lg font-semibold">{req.resources[k]}</span>
            </div>
          ))}
          <div className="border-t pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Impacted Projects</p>
            <div className="space-y-1.5">
              {impacts.map((i) => (
                <div key={i.project.id} className="flex items-center justify-between rounded-md border border-border/60 bg-secondary/40 px-2 py-1.5 text-xs">
                  <span className="truncate font-medium">{i.project.name}</span>
                  <span className="rounded-full bg-status-high-soft px-1.5 py-0.5 font-mono-num font-semibold text-status-high">+{i.delta}d</span>
                </div>
              ))}
              {impacts.length === 0 && <p className="text-xs text-muted-foreground">No projects impacted.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={cn("rounded-xl border border-border/60 bg-gradient-to-br from-card to-status-adhoc-soft/50 p-5 shadow-sm", pulse && "animate-soft-pulse")}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impact Summary</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              Delays <Counter value={impacts.length} suffix="" /> project{impacts.length !== 1 ? "s" : ""} · <Counter value={totalDelay} suffix="d" /> total
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Average slip: {avgDelay}d · {req.resources.E + req.resources.T + req.resources.D} resources reallocated.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Before vs After</h3>
            <div className="space-y-3">
              {impacts.map(({ project, oldDate, projectedDate, delta }) => (
                <div key={project.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="rounded-full bg-status-high-soft px-2 py-0.5 text-[10px] font-bold text-status-high font-mono-num">+{delta}d</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded border border-border bg-background px-2 py-1 font-mono-num text-muted-foreground line-through">{fmtDate(oldDate)}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-status-adhoc" />
                    <span className="rounded border border-status-high/30 bg-status-high-soft px-2 py-1 font-mono-num font-semibold text-status-high">{fmtDate(projectedDate)}</span>
                  </div>
                </div>
              ))}
              {impacts.length === 0 && <p className="text-sm text-muted-foreground">No projects impacted by this request.</p>}
            </div>
          </div>

          {req.status === "awaiting_reply" ? (
            <div className="sticky bottom-4 rounded-xl border border-border/60 bg-card/95 p-4 shadow-lg glass">
              <div className="flex items-start gap-3">
                <Textarea
                  placeholder="Add an optional comment for the decision log..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[64px] flex-1 resize-none text-sm"
                />
                <div className="flex shrink-0 flex-col gap-2">
                  <Button onClick={() => decide("approved")} className="gap-1.5 bg-status-on-track text-white hover:bg-status-on-track/90">
                    <Check className="h-4 w-4" /> Approve Trade-off
                  </Button>
                  <Button variant="outline" onClick={() => decide("rejected")} className="gap-1.5 border-status-high/30 text-status-high hover:bg-status-high-soft">
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
              <span className="font-medium capitalize">{req.status.replace("_", " ")}</span> by {req.decidedBy} · {req.decidedAt && fmtDateTime(req.decidedAt)}
              {req.decisionComment && <p className="mt-1 text-muted-foreground">"{req.decisionComment}"</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
