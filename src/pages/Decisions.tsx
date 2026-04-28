import { Link } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { fmtDateTime } from "@/lib/format";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Decisions() {
  const { state } = usePlan();
  const decided = state.requests.filter((r) => r.status !== "awaiting_reply");
  const pending = state.requests.filter((r) => r.status === "awaiting_reply");

  return (
    <div className="container max-w-[1100px] space-y-6 px-6 py-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Decisions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pending approvals and historical trade-offs</p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Awaiting decision · {pending.length}</h2>
        <div className="space-y-2">
          {pending.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              All caught up. No decisions pending. ✨
            </div>
          )}
          {pending.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`} className="block rounded-xl border border-status-slight/30 bg-status-slight-soft/40 p-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.requestedBy} · {fmtDateTime(r.createdAt)} · impacts {r.impacts.length} project(s)</p>
                </div>
                <span className="rounded-full bg-status-slight px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Awaiting</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decided · {decided.length}</h2>
        <div className="space-y-2">
          {decided.map((r) => (
            <Link key={r.id} to={`/requests/${r.id}`} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:shadow-md">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", r.status === "approved" ? "bg-status-on-track-soft text-status-on-track" : "bg-status-high-soft text-status-high")}>
                {r.status === "approved" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.status === "approved" ? "Approved" : "Rejected"} by {r.decidedBy} · {r.decidedAt && fmtDateTime(r.decidedAt)}</p>
                {r.decisionComment && <p className="mt-1 text-xs italic text-muted-foreground">"{r.decisionComment}"</p>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
