import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { AdhocRequest, CATEGORIES, Category, Project } from "@/lib/types";
import { fmtDate, daysBetween, reasonLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, ChevronRight, Info, LayoutDashboard, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KindPill, PriorityChip, StatusPill } from "@/components/StatusBadge";

// ── Category palette ───────────────────────────────────────────────────────────
const CAT_PALETTE: Record<Category, { solid: string; soft: string }> = {
  Subscription:    { solid: "#4F7EF7", soft: "rgba(79,126,247,0.08)"  },
  Personalization: { solid: "#8B5CF6", soft: "rgba(139,92,246,0.08)"  },
  Ads:             { solid: "#F59E0B", soft: "rgba(245,158,11,0.08)"  },
  Discovery:       { solid: "#06B6D4", soft: "rgba(6,182,212,0.08)"   },
  Engagement:      { solid: "#10B981", soft: "rgba(16,185,129,0.08)"  },
  Miscellaneous:   { solid: "#94A3B8", soft: "rgba(148,163,184,0.08)" },
  Linear:          { solid: "#6366F1", soft: "rgba(99,102,241,0.08)"  },
  AI:              { solid: "#EC4899", soft: "rgba(236,72,153,0.08)"  },
};

const LEFT_W = 308;
const DAY_PX = 13;
const ROW_H  = 42;
const CAT_H  = 48;

function dayOff(rangeStart: Date, iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - rangeStart.getTime()) / 86400000));
}

function getMonthSegs(rangeStart: Date, totalDays: number) {
  const segs: { label: string; startDay: number; endDay: number }[] = [];
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(rangeStart.getTime() + d * 86400000);
    if (d === 0 || date.getDate() === 1) {
      if (segs.length > 0) segs[segs.length - 1].endDay = d;
      segs.push({ label: date.toLocaleString("en-US", { month: "long" }), startDay: d, endDay: totalDays });
    }
  }
  return segs;
}

const initials = (n: string) => n.split(" ").map(s => s[0]).slice(0, 2).join("");

// ── Project detail sheet ───────────────────────────────────────────────────────
function ProjectDetailSheet({ project, requests, onClose }: {
  project: Project | null;
  requests: AdhocRequest[];
  onClose: () => void;
}) {
  if (!project) return null;

  const pal       = CAT_PALETTE[project.category];
  const slipped   = daysBetween(project.targetDate, project.newDate);
  const impactReqs = (project.impactedBy ?? [])
    .map(id => requests.find(r => r.id === id))
    .filter(Boolean) as AdhocRequest[];

  return (
    <Sheet open={!!project} onOpenChange={open => !open && onClose()}>
      <SheetContent className="flex w-[420px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[420px]">

        {/* Header */}
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <KindPill kind={project.kind} />
            <PriorityChip priority={project.priority} />
            <StatusPill status={project.status} />
          </div>
          <SheetTitle className="mt-2 font-display text-lg font-semibold leading-snug">
            {project.name}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{project.successMetric}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              style={{ background: pal.solid, color: "#fff" }}
              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            >
              {project.category}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-5 py-5">

          {/* Owners */}
          <section>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Owners</p>
            <div className="space-y-2.5">
              {[
                { name: project.businessPoc, role: "Business POC" },
                { name: project.productPoc,  role: "Product POC"  },
              ].map(o => (
                <div key={o.role} className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-secondary text-[10px] font-medium">
                      {initials(o.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{o.name}</p>
                    <p className="text-[11px] text-muted-foreground">{o.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2 text-sm">
              {[
                { label: "Start date",    value: fmtDate(project.startDate),  hi: false },
                { label: "Target date",   value: fmtDate(project.targetDate), hi: false },
                { label: "Current date",  value: fmtDate(project.newDate),    hi: slipped > 0 },
                { label: "Slip delta",    value: slipped > 0 ? `+${slipped} days` : "On time", hi: slipped > 0 },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className={cn("font-mono-num text-xs font-medium", row.hi && "font-semibold text-status-high")}>
                    {row.value}
                  </span>
                </div>
              ))}
              {project.delayReason && slipped > 0 && (
                <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-2">
                  <span className="text-xs text-muted-foreground">Delay reason</span>
                  <span className="text-xs font-medium">{reasonLabel[project.delayReason]}</span>
                </div>
              )}
            </div>
          </section>

          {/* Progress */}
          <section>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Progress</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-mono-num font-semibold">{project.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    project.status === "delivered" && "bg-status-on-track",
                    project.status === "on_track"  && "bg-status-on-track",
                    project.status === "at_risk"   && "bg-status-slight",
                    project.status === "delayed"   && "bg-status-high",
                  )}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </section>

          {/* Resources */}
          <section>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resources (planned → current)</p>
            <div className="grid grid-cols-3 gap-2">
              {(["E", "T", "D"] as const).map(k => {
                const planned = project.plannedResources[k];
                const current = project.currentResources[k];
                const diff    = current - planned;
                return (
                  <div key={k} className="rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">{k === "E" ? "Engineers" : k === "T" ? "Testers" : "Designers"}</p>
                    <p className="mt-1 font-mono-num text-base font-semibold">
                      {current}
                      <span className="text-xs text-muted-foreground">/{planned}</span>
                    </p>
                    {diff !== 0 && (
                      <p className={cn("text-[10px] font-semibold", diff < 0 ? "text-status-high" : "text-status-on-track")}>
                        {diff > 0 ? "+" : ""}{diff}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Adhoc impact */}
          {impactReqs.length > 0 && (
            <section>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ad-hoc Impact</p>
              <div className="space-y-2">
                {impactReqs.map(req => (
                  <div key={req.id} className="rounded-lg border border-status-adhoc/30 bg-status-adhoc/8 p-3">
                    <div className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-status-adhoc" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-status-adhoc">{req.title}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{req.description}</p>
                        {req.decisionComment && (
                          <p className="mt-1.5 rounded border border-border/50 bg-background/60 px-2 py-1 text-[11px] italic text-muted-foreground">
                            "{req.decisionComment}"
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-muted-foreground">
                          <span>By {req.requestedBy}</span>
                          <span>·</span>
                          <span>Decided by {req.decidedBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Delivery history */}
          {project.deliveryHistory.length > 0 && (
            <section>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Delivery History</p>
              <div className="space-y-2">
                {project.deliveryHistory.map(h => (
                  <div key={h.id} className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs">
                    <span className="font-mono-num text-muted-foreground line-through">{fmtDate(h.fromDate)}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0 text-status-adhoc" />
                    <span className="font-mono-num font-semibold">{fmtDate(h.toDate)}</span>
                    <span className="ml-1 rounded-full bg-background px-2 py-0.5 text-[10px]">{reasonLabel[h.reason]}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{h.actor}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Task bar ──────────────────────────────────────────────────────────────────
function TaskBar({ project, rangeStart, requests, onSelect }: {
  project: Project;
  rangeStart: Date;
  requests: AdhocRequest[];
  onSelect: (p: Project) => void;
}) {
  const pal       = CAT_PALETTE[project.category];
  const startOff  = dayOff(rangeStart, project.startDate);
  const targetOff = dayOff(rangeStart, project.targetDate);
  const newOff    = dayOff(rangeStart, project.newDate);
  const hasSlip   = newOff > targetOff;

  const BAR_H  = Math.round(ROW_H * 0.58);
  const barTop = Math.round((ROW_H - BAR_H) / 2);

  const isAdhoc     = project.kind === "adhoc";
  const isDelivered = project.status === "delivered";

  const plannedW  = Math.max(DAY_PX * 2, (targetOff - startOff + 1) * DAY_PX);
  const slipW     = hasSlip ? (newOff - targetOff) * DAY_PX : 0;
  const totalW    = plannedW + slipW;
  const slipColor = project.status === "at_risk" ? "#F59E0B" : "#E84040";

  const impactReq = project.impactedBy?.length
    ? requests.find(r => r.id === project.impactedBy![0])
    : undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(project)}
          onKeyDown={e => e.key === "Enter" && onSelect(project)}
          style={{ position: "absolute", left: startOff * DAY_PX, top: barTop, width: totalW, height: BAR_H, display: "flex", cursor: "pointer", borderRadius: 4 }}
          className="transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {/* Planned / base bar */}
          <div style={{
            width: plannedW, height: "100%", flexShrink: 0,
            background: isAdhoc ? pal.soft : pal.solid,
            opacity: isDelivered ? 0.72 : 1,
            border: isAdhoc ? `1.5px dashed ${pal.solid}` : "none",
            borderRadius: hasSlip ? "4px 0 0 4px" : "4px",
            position: "relative", overflow: "hidden",
          }}>
            {isDelivered && (
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,transparent,transparent 5px,rgba(255,255,255,0.22) 5px,rgba(255,255,255,0.22) 10px)" }} />
            )}
            {plannedW > 60 && (
              <span style={{
                position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)",
                fontSize: 10, fontWeight: 600,
                color: isAdhoc ? pal.solid : "#fff",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: plannedW - 14, pointerEvents: "none",
              }}>
                {isAdhoc ? "⚡ " : ""}{project.name}
              </span>
            )}
          </div>

          {/* Slip extension */}
          {hasSlip && slipW > 0 && (
            <div style={{
              width: slipW, height: "100%", flexShrink: 0,
              background: slipColor, opacity: 0.85,
              borderRadius: "0 4px 4px 0",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(255,255,255,0.18) 4px,rgba(255,255,255,0.18) 8px)" }} />
            </div>
          )}
        </div>
      </TooltipTrigger>

      {/* Hover tooltip — summary only, click for full detail */}
      <TooltipContent side="top" className="max-w-[240px] space-y-1 p-2.5 text-xs">
        <p className="font-semibold">{project.name}</p>
        <div className="flex flex-wrap gap-1 pb-0.5">
          <KindPill kind={project.kind} />
          <StatusPill status={project.status} />
        </div>
        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          <div className="flex justify-between gap-4"><span>Target</span><span className="font-mono-num text-foreground">{fmtDate(project.targetDate)}</span></div>
          {hasSlip && <div className="flex justify-between gap-4 text-status-high"><span>Slipped</span><span className="font-mono-num font-semibold">{fmtDate(project.newDate)} (+{daysBetween(project.targetDate, project.newDate)}d)</span></div>}
          {impactReq && <p className="pt-0.5 text-status-adhoc">⚡ {impactReq.title}</p>}
        </div>
        <p className="border-t border-border/40 pt-1 text-[10px] text-muted-foreground">Click to see full details</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ── Date column header ─────────────────────────────────────────────────────────
function DateHeader({ rangeStart, totalDays, todayOff }: {
  rangeStart: Date;
  totalDays: number;
  todayOff: number | null;
}) {
  const months    = getMonthSegs(rangeStart, totalDays);
  const totalPx   = totalDays * DAY_PX;
  const weekCount = Math.ceil(totalDays / 7);

  return (
    <div style={{ width: totalPx, background: "hsl(var(--card))" }}>
      <div style={{ display: "flex", height: 28, borderBottom: "1px solid hsl(var(--border))" }}>
        {months.map((m, i) => (
          <div key={i} style={{ width: (m.endDay - m.startDay) * DAY_PX, flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(var(--muted-foreground))", borderRight: "1px solid hsl(var(--border))" }}>
            {m.label}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", height: 26, position: "relative", borderBottom: "2px solid hsl(var(--border))" }}>
        {Array.from({ length: weekCount }, (_, w) => {
          const startDay = w * 7;
          const wDays    = Math.min(7, totalDays - startDay);
          const label    = new Date(rangeStart.getTime() + startDay * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div key={w} style={{ width: wDays * DAY_PX, flexShrink: 0, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, color: "hsl(var(--muted-foreground))", borderRight: "1px solid hsl(var(--border)/0.5)" }}>
              {label}
            </div>
          );
        })}
        {todayOff !== null && (
          <>
            <div style={{ position: "absolute", left: todayOff * DAY_PX + DAY_PX / 2, top: 0, bottom: 0, width: 2, background: "hsl(var(--status-high))", zIndex: 2 }} />
            <div style={{ position: "absolute", left: todayOff * DAY_PX + DAY_PX / 2 - 18, top: 3, background: "hsl(var(--status-high))", color: "#fff", fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3, letterSpacing: 0.4 }}>TODAY</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Timeline() {
  const navigate = useNavigate();
  const { state } = usePlan();
  const [collapsed,   setCollapsed]   = useState<Record<string, boolean>>({});
  const [filterCat,   setFilterCat]   = useState<Category | "All">("All");
  const [filterKind,  setFilterKind]  = useState<"all" | "planned" | "adhoc">("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const qProjects = useMemo(
    () => state.projects.filter(p => p.quarter === state.quarter),
    [state.projects, state.quarter]
  );

  const { rangeStart, totalDays } = useMemo(() => {
    if (!qProjects.length) return { rangeStart: new Date(), totalDays: 91 };
    const starts = qProjects.map(p => new Date(p.startDate).getTime());
    const ends   = qProjects.map(p => new Date(p.newDate).getTime());
    const rs     = new Date(Math.min(...starts));
    const days   = Math.ceil((Math.max(...ends) - rs.getTime()) / 86400000) + 10;
    return { rangeStart: rs, totalDays: days };
  }, [qProjects]);

  const todayOff = useMemo(() => {
    const off = Math.floor((Date.now() - rangeStart.getTime()) / 86400000);
    return off >= 0 && off < totalDays ? off : null;
  }, [rangeStart, totalDays]);

  const totalPx = totalDays * DAY_PX;

  const grouped = useMemo(() =>
    CATEGORIES
      .map(cat => ({
        cat,
        projects: qProjects
          .filter(p => p.category === cat)
          .filter(p => filterKind === "all" || p.kind === filterKind)
          .sort((a, b) => a.priority - b.priority),
      }))
      .filter(g => g.projects.length > 0)
      .filter(g => filterCat === "All" || g.cat === filterCat),
    [qProjects, filterCat, filterKind]
  );

  const toggle = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

      {/* ── Page header ── */}
      <header className="flex flex-shrink-0 flex-col gap-1 px-5 pb-3 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Portfolio Timeline</h1>
          <p className="text-xs text-muted-foreground">
            {state.quarter} 2025 · Quarter-level view of all planned and ad-hoc projects and their impact
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:border-accent/50 hover:bg-accent/5 hover:text-accent"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </button>
      </header>

      {/* ── Filter bar ── */}
      <div className="flex h-11 flex-shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-5 backdrop-blur">
        <Select value={filterCat} onValueChange={v => setFilterCat(v as Category | "All")}>
          <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterKind} onValueChange={v => setFilterKind(v as "all" | "planned" | "adhoc")}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="adhoc">Ad-hoc</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent">
                <Info className="h-3.5 w-3.5" />Legend
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-3">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bar legend</p>
              <div className="space-y-2">
                {[
                  { bg: "#4F7EF7", label: "On track" },
                  { bg: "#F59E0B", label: "At risk — slip portion" },
                  { bg: "#E84040", label: "Delayed — slip portion" },
                  { bg: "#10B981", label: "Delivered", stripe: true },
                  { bg: "rgba(139,92,246,0.1)", border: "#8B5CF6", label: "Ad-hoc project" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs">
                    <div style={{ width: 22, height: 10, borderRadius: 3, flexShrink: 0, background: item.bg, border: item.border ? `1.5px dashed ${item.border}` : "none", opacity: item.stripe ? 0.72 : 1, backgroundImage: item.stripe ? "repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(255,255,255,0.3) 4px,rgba(255,255,255,0.3) 8px)" : undefined }} />
                    <span className="text-muted-foreground">{item.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5 text-xs">
                  <Zap className="h-3.5 w-3.5 flex-shrink-0 text-status-adhoc" />
                  <span className="text-muted-foreground">Ad-hoc impact on project</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Gantt body ── */}
      <div className="flex-1 overflow-auto">
        <div style={{ width: LEFT_W + totalPx, minWidth: "100%" }}>

          {/* Sticky header */}
          <div style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <div style={{ width: LEFT_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 25, background: "hsl(var(--card))", borderRight: "2px solid hsl(var(--border))" }}>
              <div style={{ height: 28, display: "flex", alignItems: "center", paddingLeft: 20, fontSize: 10, fontWeight: 700, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid hsl(var(--border))" }}>Project</div>
              <div style={{ height: 26, display: "flex", alignItems: "center", paddingLeft: 20, fontSize: 10, color: "hsl(var(--muted-foreground))", borderBottom: "2px solid hsl(var(--border))" }}>Owner · Kind · Priority</div>
            </div>
            <DateHeader rangeStart={rangeStart} totalDays={totalDays} todayOff={todayOff} />
          </div>

          {/* Category groups */}
          {grouped.map(({ cat, projects }) => {
            const pal           = CAT_PALETTE[cat];
            const isCollapsed   = !!collapsed[cat];
            const deliveredCount = projects.filter(p => p.status === "delivered").length;
            const impactedCount  = projects.filter(p => (p.impactedBy?.length ?? 0) > 0).length;
            const pct = projects.length ? Math.round(deliveredCount / projects.length * 100) : 0;

            return (
              <div key={cat}>
                {/* Category row */}
                <div style={{ display: "flex", height: CAT_H, background: pal.soft, borderBottom: "1px solid hsl(var(--border)/0.7)", cursor: "pointer" }} onClick={() => toggle(cat)}>
                  <div style={{ width: LEFT_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 5, background: pal.soft, borderRight: "2px solid hsl(var(--border))", display: "flex", alignItems: "center", gap: 7, paddingLeft: 14, overflow: "hidden" }}>
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />}
                    <span style={{ background: pal.solid, color: "#fff", fontWeight: 700, fontSize: 11, padding: "2px 9px", borderRadius: 4, letterSpacing: 0.3, flexShrink: 0, whiteSpace: "nowrap" }}>{cat}</span>
                    <span style={{ fontSize: 11, color: pal.solid, fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}>{projects.length}p</span>
                    {impactedCount > 0 && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, whiteSpace: "nowrap", fontSize: 10, fontWeight: 600, color: "hsl(var(--status-adhoc))", background: "hsl(var(--status-adhoc-soft))", borderRadius: 99, padding: "1px 6px" }}>
                        <Zap style={{ width: 9, height: 9, flexShrink: 0 }} />{impactedCount}
                      </span>
                    )}
                  </div>
                  <div style={{ position: "relative", width: totalPx, flexShrink: 0 }}>
                    {Array.from({ length: Math.ceil(totalDays / 7) }, (_, w) => (
                      <div key={w} style={{ position: "absolute", left: w * 7 * DAY_PX, top: 0, bottom: 0, width: 1, background: "hsl(var(--border)/0.3)" }} />
                    ))}
                    <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 56, height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pal.solid, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10.5, color: pal.solid, fontWeight: 700, whiteSpace: "nowrap" }}>{pct}%</span>
                    </div>
                  </div>
                </div>

                {/* Project rows */}
                {!isCollapsed && projects.map(p => {
                  const impactReq = p.impactedBy?.length ? state.requests.find(r => r.id === p.impactedBy![0]) : undefined;
                  return (
                    <div key={p.id} style={{ display: "flex", height: ROW_H, borderBottom: "1px solid hsl(var(--border)/0.45)" }} className="group bg-card transition-colors hover:bg-secondary/40">
                      {/* Left label */}
                      <div
                        style={{ width: LEFT_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 10, borderRight: "2px solid hsl(var(--border))", display: "flex", alignItems: "center", paddingLeft: 26, paddingRight: 8, gap: 6 }}
                        className="bg-card transition-colors group-hover:bg-secondary/40"
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <button
                              onClick={() => setSelectedProject(p)}
                              style={{ fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: LEFT_W - 96, color: "hsl(var(--foreground))", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                              className="hover:text-accent hover:underline"
                            >
                              {p.name}
                            </button>
                            {impactReq && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Zap className="h-3 w-3 flex-shrink-0 cursor-default text-status-adhoc" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-[220px] text-xs">
                                  <p className="font-semibold">Impacted by ad-hoc request</p>
                                  <p className="mt-0.5 text-muted-foreground">{impactReq.title}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                            <span style={{ fontSize: 9.5, color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>{p.productPoc}</span>
                            <KindPill kind={p.kind} />
                            <PriorityChip priority={p.priority} />
                          </div>
                        </div>
                      </div>

                      {/* Timeline area */}
                      <div style={{ position: "relative", width: totalPx, flexShrink: 0 }}>
                        {Array.from({ length: Math.ceil(totalDays / 7) }, (_, w) => (
                          <div key={w} style={{ position: "absolute", left: w * 7 * DAY_PX, top: 0, bottom: 0, width: 1, background: "hsl(var(--border)/0.3)" }} />
                        ))}
                        {todayOff !== null && (
                          <div style={{ position: "absolute", left: todayOff * DAY_PX + DAY_PX / 2, top: 0, bottom: 0, width: 1.5, background: "hsl(var(--status-high)/0.22)", zIndex: 1 }} />
                        )}
                        <TaskBar project={p} rangeStart={rangeStart} requests={state.requests} onSelect={setSelectedProject} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{ height: 40 }} />
        </div>
      </div>

      {/* ── Project detail sheet ── */}
      <ProjectDetailSheet
        project={selectedProject}
        requests={state.requests}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
