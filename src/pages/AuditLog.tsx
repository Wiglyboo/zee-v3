import { usePlan } from "@/state/PlanContext";
import { fmtDateTime } from "@/lib/format";
import { Check, X, GitPullRequest, Clock, Calendar, FolderPlus, Pencil } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const iconFor = (type: string) => {
  switch (type) {
    case "request_created": return { I: GitPullRequest, cls: "bg-status-adhoc-soft text-status-adhoc" };
    case "approved": return { I: Check, cls: "bg-status-on-track-soft text-status-on-track" };
    case "rejected": return { I: X, cls: "bg-status-high-soft text-status-high" };
    case "timeline_shift": return { I: Calendar, cls: "bg-status-slight-soft text-status-slight" };
    case "project_created": return { I: FolderPlus, cls: "bg-status-planned-soft text-status-planned" };
    case "project_updated": return { I: Pencil, cls: "bg-secondary text-foreground" };
    case "delivery_updated": return { I: Calendar, cls: "bg-status-slight-soft text-status-slight" };
    default: return { I: Clock, cls: "bg-secondary text-muted-foreground" };
  }
};

export default function AuditLog() {
  const { state } = usePlan();
  const grouped: Record<string, typeof state.audit> = {};
  state.audit.forEach((a) => {
    const day = new Date(a.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    (grouped[day] ||= []).push(a);
  });

  return (
    <div className="container max-w-[900px] space-y-6 px-6 py-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chronological record of every change</p>
      </header>

      <div className="space-y-6">
        {Object.entries(grouped).map(([day, entries]) => (
          <div key={day}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</h3>
            <div className="space-y-2">
              {entries.map((a) => {
                const { I, cls } = iconFor(a.type);
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cls)}>
                      <I className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{a.summary}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="bg-secondary text-[8px]">{a.actor.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{a.actor}</span>
                        <span>·</span>
                        <span className="font-mono-num">{fmtDateTime(a.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
