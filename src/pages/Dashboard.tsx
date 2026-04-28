import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { BarChart3, CheckCircle2, GanttChart, Layers, Zap } from "lucide-react";
import { usePlan } from "@/state/PlanContext";
import { Counter } from "@/components/Counter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CATEGORIES, Category, Project } from "@/lib/types";
import { daysBetween, fmtDate, reasonLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusColors = {
  delivered: "hsl(var(--status-on-track))",
  onTrack: "hsl(var(--accent))",
  delayed: "hsl(var(--status-high))",
  approved: "hsl(var(--status-on-track))",
  rejected: "hsl(var(--status-high))",
  pending: "hsl(var(--status-slight))",
  neutral: "hsl(var(--muted-foreground))",
};

const tabOptions = ["All", ...CATEGORIES] as const;
type ExecutionFilter = "all" | "planned" | "impacted" | "delivered" | "onTrack" | "delayed";

type Breakdown = { label: string; value: number; tone: "green" | "blue" | "yellow" | "red" | "muted" };

const toneClasses: Record<Breakdown["tone"], string> = {
  green: "text-status-on-track bg-status-on-track",
  blue: "text-accent bg-accent",
  yellow: "text-status-slight bg-status-slight",
  red: "text-status-high bg-status-high",
  muted: "text-muted-foreground bg-muted-foreground",
};

const CompactMetricCard = ({
  title,
  value,
  suffix = "",
  icon: Icon,
  breakdown,
  progress,
  active,
  onClick,
  className,
}: {
  title: string;
  value: number;
  suffix?: string;
  icon: typeof Layers;
  breakdown: Breakdown[];
  progress?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group min-h-[74px] rounded-lg border border-border/60 bg-card/95 p-2.5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md",
          active && "border-accent/70 bg-accent/5 shadow-md",
          className
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-1 font-display text-2xl font-semibold leading-none tracking-tight md:text-3xl">
              <Counter value={value} suffix={suffix} duration={650} />
            </p>
          </div>
          <div className="rounded-md bg-accent/10 p-1 text-accent">
            <Icon className="h-3 w-3" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] leading-tight text-muted-foreground">
          {breakdown.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1 whitespace-nowrap">
              <span className={cn("h-1.5 w-1.5 rounded-full", toneClasses[item.tone].split(" ")[1])} />
              {item.label} <span className="font-mono-num text-foreground">{item.value}</span>
            </span>
          ))}
        </div>
        {progress !== undefined && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-status-on-track transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        )}
      </button>
    </TooltipTrigger>
    <TooltipContent className="space-y-1 text-xs">
      <div className="font-semibold">{title}</div>
      {breakdown.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-6">
          <span>{item.label}</span><span className="font-mono-num">{item.value}</span>
        </div>
      ))}
      {progress !== undefined && <div>Plan adherence: <span className="font-mono-num">{progress}%</span></div>}
    </TooltipContent>
  </Tooltip>
);

const MiniDonut = ({ title, data, total }: { title: string; data: { name: string; value: number; color: string }[]; total: number }) => (
  <div className="grid min-h-[92px] grid-cols-[68px_1fr] items-center gap-2 rounded-lg border border-border/60 bg-card/95 p-2.5 shadow-sm transition-all duration-300 hover:border-accent/40">
    <div className="relative h-[66px] w-[66px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={21} outerRadius={31} paddingAngle={2} dataKey="value" isAnimationActive animationDuration={650}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <RTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number, name: string) => [`${value}`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display text-base font-semibold">{total}</span>
        <span className="text-[9px] uppercase text-muted-foreground">total</span>
      </div>
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-1.5 grid gap-0.5 text-[10px]">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: d.color }} />{d.name}</span>
            <span className="font-mono-num text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ImpactBar = ({ impacted, total, onClick, active, className }: { impacted: number; total: number; onClick: () => void; active?: boolean; className?: string }) => {
  const pct = total ? Math.round((impacted / total) * 100) : 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn("min-h-[82px] rounded-lg border border-border/60 bg-card/95 p-2.5 text-left shadow-sm transition-all duration-300 hover:border-accent/40", active && "border-accent/70 bg-accent/5", className)}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Adhoc Impact</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="font-display text-2xl font-semibold leading-none"><Counter value={pct} suffix="%" duration={650} /></p>
            <p className="text-[10px] text-muted-foreground"><span className="font-mono-num text-foreground">{impacted}</span> impacted · <span className="font-mono-num text-foreground">{Math.max(total - impacted, 0)}</span> clear</p>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-status-adhoc transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground"><span>Impacted</span><span>Non-impacted</span></div>
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs">{impacted} of {total} planned projects have ad-hoc impact.</TooltipContent>
    </Tooltip>
  );
};

const PercentBar = ({ value, tone = "green" }: { value: number; tone?: "green" | "yellow" | "red" | "blue" }) => (
  <div className="min-w-[92px] space-y-1">
    <div className="flex justify-between text-[11px] font-mono-num"><span>{value}%</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          tone === "green" && "bg-status-on-track",
          tone === "yellow" && "bg-status-slight",
          tone === "red" && "bg-status-high",
          tone === "blue" && "bg-accent"
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  </div>
);

const ProjectStatusTimeline = ({ project }: { project: Project }) => {
  const delay = Math.max(0, daysBetween(project.targetDate, project.newDate));
  const isOnTrack = delay === 0;
  const isSlightDelay = delay > 0 && delay <= 7;
  const endDate = new Date(Math.max(new Date(project.targetDate).getTime(), new Date(project.newDate).getTime())).toISOString();
  const span = Math.max(daysBetween(project.startDate, endDate), 1);
  const currentPct = Math.max(0, Math.min(100, (daysBetween(project.startDate, new Date().toISOString()) / span) * 100));
  const targetPct = Math.max(0, Math.min(100, (daysBetween(project.startDate, project.targetDate) / span) * 100));
  const newPct = Math.max(0, Math.min(100, (daysBetween(project.startDate, project.newDate) / span) * 100));
  const tone = isOnTrack ? "bg-status-on-track" : isSlightDelay ? "bg-status-slight" : "bg-status-high";
  const label = isOnTrack ? "On track | Delivery on time" : `${isSlightDelay ? "Slight delay" : "High delay"} | Delayed by ${delay} days`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className={cn("font-medium", isOnTrack ? "text-status-on-track" : isSlightDelay ? "text-status-slight" : "text-status-high")}>{label}</span>
            {!isOnTrack && <span className="font-mono-num text-muted-foreground">New: {fmtDate(project.newDate)}</span>}
          </div>
          <div className="relative h-4 rounded-full bg-secondary">
            <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", tone)} style={{ width: `${Math.max(currentPct, 2)}%` }} />
            <div className="absolute top-[-4px] h-6 w-px bg-foreground/70" style={{ left: `${targetPct}%` }} />
            <div className="absolute -top-1 h-6 w-px bg-accent" style={{ left: `${newPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Target</span><span>New</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="space-y-1 text-xs">
        <div className="font-semibold">{project.name}</div>
        <div>Planned date: <span className="font-mono-num">{fmtDate(project.targetDate)}</span></div>
        <div>New date: <span className="font-mono-num">{fmtDate(project.newDate)}</span></div>
        <div>Delay delta: <span className="font-mono-num">{delay} days</span></div>
        <div>Delay reason: {delay ? reasonLabel[project.delayReason ?? "estimation"] : "Delivery on time"}</div>
      </TooltipContent>
    </Tooltip>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = usePlan();
  const [activeCategory, setActiveCategory] = useState<(typeof tabOptions)[number]>("All");
  const [executionFilter, setExecutionFilter] = useState<ExecutionFilter>("all");

  const quarterProjects = useMemo(() => state.projects.filter((p) => p.quarter === state.quarter), [state.projects, state.quarter]);
  const quarterRequests = useMemo(() => state.requests.filter((r) => r.quarter === state.quarter), [state.requests, state.quarter]);
  const plannedProjects = quarterProjects.filter((p) => p.kind === "planned");
  const deliveredCount = plannedProjects.filter((p) => p.status === "delivered").length;
  const onTrackCount = plannedProjects.filter((p) => p.status !== "delivered" && daysBetween(p.targetDate, p.newDate) <= 0).length;
  const delayedCount = plannedProjects.filter((p) => p.status !== "delivered" && daysBetween(p.targetDate, p.newDate) > 0).length;
  const approvedCount = quarterRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = quarterRequests.filter((r) => r.status === "rejected").length;
  const pendingCount = quarterRequests.filter((r) => r.status === "awaiting_reply").length;
  const plannedImpacted = plannedProjects.filter((p) => p.impactedBy?.length);
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const planAdherence = pct(deliveredCount, plannedProjects.length);

  const plannedPie = [
    { name: "Delivered", value: deliveredCount, color: statusColors.delivered },
    { name: "On Track", value: onTrackCount, color: statusColors.onTrack },
    { name: "Delayed", value: delayedCount, color: statusColors.delayed },
  ].filter((d) => d.value > 0);

  const requestPie = [
    { name: "Approved", value: approvedCount, color: statusColors.approved },
    { name: "Pending", value: pendingCount, color: statusColors.pending },
    { name: "Rejected", value: rejectedCount, color: statusColors.rejected },
  ].filter((d) => d.value > 0);

  const categoryRows = CATEGORIES.map((category) => {
    const projects = plannedProjects.filter((p) => p.category === category);
    const delivered = projects.filter((p) => p.status === "delivered").length;
    const onTrack = projects.filter((p) => p.status !== "delivered" && daysBetween(p.targetDate, p.newDate) <= 0).length;
    const delayed = projects.filter((p) => p.status !== "delivered" && daysBetween(p.targetDate, p.newDate) > 0).length;
    const adherence = pct(delivered, projects.length);
    return {
      category,
      planned: projects.length,
      deliveredPct: pct(delivered, projects.length),
      onTrackPct: pct(onTrack, projects.length),
      delayedPct: pct(delayed, projects.length),
      adhocRequests: quarterRequests.filter((r) => r.category === category).length,
      impacted: projects.filter((p) => p.impactedBy?.length).length,
      adherence,
    };
  });

  const matchesExecutionFilter = (project: Project) => {
    const delay = daysBetween(project.targetDate, project.newDate);
    if (executionFilter === "planned" || executionFilter === "all") return true;
    if (executionFilter === "impacted") return Boolean(project.impactedBy?.length);
    if (executionFilter === "delivered") return project.status === "delivered";
    if (executionFilter === "onTrack") return project.status !== "delivered" && delay <= 0;
    if (executionFilter === "delayed") return project.status !== "delivered" && delay > 0;
    return true;
  };

  const visibleProjects = plannedProjects
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter(matchesExecutionFilter)
    .sort((a, b) => a.priority - b.priority || new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  return (
    <div className="container max-w-[1500px] space-y-3 px-5 py-4">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">Portfolio Command Center</h1>
          <p className="text-xs text-muted-foreground">{state.quarter} 2025 · Planned delivery, execution health, and ad-hoc impact</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/timeline")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-all hover:border-accent/50 hover:bg-accent/5 hover:text-accent"
        >
          <GanttChart className="h-3.5 w-3.5" />
          Timeline
        </button>
      </header>

      <section className="rounded-xl border border-border/60 bg-secondary/25 p-2.5 shadow-sm animate-fade-in">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          <CompactMetricCard
            title="Total Projects"
            value={quarterProjects.length}
            icon={Layers}
            active={executionFilter === "all"}
            onClick={() => setExecutionFilter("all")}
            breakdown={[{ label: "Planned", value: plannedProjects.length, tone: "blue" }, { label: "Adhoc", value: Math.max(quarterProjects.length - plannedProjects.length, 0), tone: "yellow" }]}
          />
          <ImpactBar impacted={plannedImpacted.length} total={plannedProjects.length} active={executionFilter === "impacted"} onClick={() => setExecutionFilter("impacted")} />
          <CompactMetricCard title="Planned Projects" value={plannedProjects.length} icon={BarChart3} active={executionFilter === "planned"} onClick={() => setExecutionFilter("planned")} breakdown={[{ label: "Delivered", value: deliveredCount, tone: "green" }, { label: "On Track", value: onTrackCount, tone: "blue" }, { label: "Delayed", value: delayedCount, tone: "red" }]} />
          <MiniDonut title="Planned Status" data={plannedPie} total={plannedProjects.length} />
          <CompactMetricCard title="Adhoc Requests" value={quarterRequests.length} icon={Zap} active={executionFilter === "impacted"} onClick={() => setExecutionFilter("impacted")} breakdown={[{ label: "Approved", value: approvedCount, tone: "green" }, { label: "Pending", value: pendingCount, tone: "yellow" }, { label: "Rejected", value: rejectedCount, tone: "red" }]} />
          <MiniDonut title="Adhoc Status" data={requestPie} total={quarterRequests.length} />
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card shadow-sm animate-fade-in">
        <div className="border-b border-border/60 p-5">
          <h2 className="text-sm font-semibold">Plan Health by Category</h2>
          <p className="text-xs text-muted-foreground">Adherence equals delivered planned projects divided by planned projects.</p>
        </div>
        <div className="max-h-[380px] overflow-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Product Category</th><th className="px-3 py-3 font-medium">Planned</th><th className="px-3 py-3 font-medium">Delivered %</th><th className="px-3 py-3 font-medium">On Track %</th><th className="px-3 py-3 font-medium">Delayed %</th><th className="px-3 py-3 font-medium">Adhoc Requests</th><th className="px-3 py-3 font-medium">Projects Impacted</th><th className="px-3 py-3 font-medium">Plan Adherence %</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((row) => {
                const adherenceTone = row.adherence >= 75 ? "green" : row.adherence >= 40 ? "yellow" : "red";
                return (
                  <tr key={row.category} className="border-b border-border/40 transition-colors hover:bg-secondary/35">
                    <td className="px-5 py-3 font-medium">{row.category}</td><td className="px-3 py-3 font-mono-num">{row.planned}</td><td className="px-3 py-3"><PercentBar value={row.deliveredPct} /></td><td className="px-3 py-3"><PercentBar value={row.onTrackPct} tone="blue" /></td><td className="px-3 py-3"><PercentBar value={row.delayedPct} tone={row.delayedPct ? "red" : "green"} /></td><td className="px-3 py-3 font-mono-num">{row.adhocRequests}</td><td className="px-3 py-3 font-mono-num">{row.impacted}</td><td className="px-3 py-3"><PercentBar value={row.adherence} tone={adherenceTone} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card shadow-sm animate-fade-in">
        <div className="border-b border-border/60 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Project-Level Execution View</h2>
              <p className="text-xs text-muted-foreground">Timeline bars fill from start date to current date, with target and new delivery markers.</p>
            </div>
            <div className="flex max-w-full gap-1 overflow-x-auto pb-1">
              {tabOptions.map((tab) => (
                <button key={tab} onClick={() => setActiveCategory(tab)} className={cn("whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all", activeCategory === tab ? "bg-accent text-accent-foreground shadow-sm" : "bg-secondary/70 text-muted-foreground hover:bg-secondary")}>{tab}</button>
              ))}
            </div>
          </div>
        </div>
        {visibleProjects.length > 0 ? (
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
                <tr className="border-b border-border/60 text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Project Name</th><th className="px-3 py-3 font-medium">Start Date</th><th className="px-3 py-3 font-medium">Target Delivery Date</th><th className="px-5 py-3 font-medium">Status Visualization</th>
                </tr>
              </thead>
              <tbody className="transition-opacity duration-300">
                {visibleProjects.map((project) => (
                  <tr key={project.id} className="border-b border-border/40 transition-colors hover:bg-secondary/35">
                    <td className="px-5 py-4"><Link to={`/projects/${project.id}`} className="font-medium hover:text-accent">{project.name}</Link><p className="mt-0.5 text-xs text-muted-foreground">{project.category}</p></td>
                    <td className="px-3 py-4 font-mono-num text-xs">{fmtDate(project.startDate)}</td>
                    <td className="px-3 py-4 font-mono-num text-xs">{fmtDate(project.targetDate)}</td>
                    <td className="px-5 py-4"><ProjectStatusTimeline project={project} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-status-on-track" />
            <p className="mt-3 font-display text-lg font-semibold">No delays — excellent execution</p>
            <p className="mt-1 text-sm text-muted-foreground">No planned projects match this category.</p>
          </div>
        )}
      </section>
    </div>
  );
}
