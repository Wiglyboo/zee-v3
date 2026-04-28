import { ProjectStatus, ProjectKind, Urgency } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusMap: Record<ProjectStatus, { label: string; cls: string; dot: string }> = {
  on_track: { label: "On Track", cls: "bg-status-on-track-soft text-status-on-track", dot: "bg-status-on-track" },
  at_risk: { label: "At Risk", cls: "bg-status-slight-soft text-status-slight", dot: "bg-status-slight" },
  delayed: { label: "Delayed", cls: "bg-status-high-soft text-status-high", dot: "bg-status-high" },
  delivered: { label: "Delivered", cls: "bg-status-planned-soft text-status-planned", dot: "bg-status-planned" },
};

export const StatusPill = ({ status }: { status: ProjectStatus }) => {
  const s = statusMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", s.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
};

export const KindPill = ({ kind }: { kind: ProjectKind }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
      kind === "adhoc" ? "bg-status-adhoc-soft text-status-adhoc" : "bg-secondary text-muted-foreground"
    )}
  >
    {kind === "adhoc" ? "Ad-hoc" : "Planned"}
  </span>
);

const urg: Record<Urgency, string> = {
  low: "bg-secondary text-muted-foreground",
  medium: "bg-status-slight-soft text-status-slight",
  high: "bg-status-high-soft text-status-high",
};

export const UrgencyPill = ({ urgency }: { urgency: Urgency }) => (
  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", urg[urgency])}>
    {urgency}
  </span>
);

export const PriorityChip = ({ priority }: { priority: 1 | 2 | 3 }) => {
  const colors = {
    1: "bg-status-high-soft text-status-high border-status-high/20",
    2: "bg-status-slight-soft text-status-slight border-status-slight/20",
    3: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold", colors[priority])}>
      P{priority}
    </span>
  );
};

export const RequestStatusPill = ({ status }: { status: "awaiting_reply" | "approved" | "rejected" }) => {
  const map = {
    awaiting_reply: { label: "Awaiting Reply", cls: "bg-status-slight-soft text-status-slight" },
    approved: { label: "Approved", cls: "bg-status-on-track-soft text-status-on-track" },
    rejected: { label: "Rejected", cls: "bg-status-high-soft text-status-high" },
  };
  const s = map[status];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", s.cls)}>{s.label}</span>;
};
