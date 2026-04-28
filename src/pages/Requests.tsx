import { Link, useNavigate } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { UrgencyPill, RequestStatusPill } from "@/components/StatusBadge";
import { fmtDateTime, fmtDate } from "@/lib/format";
import { ArrowRight, GitPullRequest, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Requests() {
  const { state } = usePlan();
  const navigate = useNavigate();
  const reqs = state.requests.filter((r) => r.quarter === state.quarter);

  return (
    <div className="container max-w-[1100px] space-y-6 px-6 py-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Ad-hoc Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">All change requests this quarter</p>
        </div>
        <Button onClick={() => navigate("/requests/new")} className="gap-1.5 bg-gradient-to-r from-accent to-status-adhoc text-white">
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </header>

      <div className="space-y-2">
        {reqs.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No requests yet — quarter is on plan ✨
          </div>
        )}
        {reqs.map((r) => (
          <Link
            key={r.id}
            to={`/requests/${r.id}`}
            className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-status-adhoc-soft text-status-adhoc">
              <GitPullRequest className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{r.title}</h3>
                <UrgencyPill urgency={r.urgency} />
                <RequestStatusPill status={r.status} />
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {r.requestedBy} · {r.category} · target {fmtDate(r.targetDate)} · impacts {r.impacts.length} project(s) · {fmtDateTime(r.createdAt)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
