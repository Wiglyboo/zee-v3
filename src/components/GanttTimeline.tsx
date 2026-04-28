import { Project } from "@/lib/types";
import { daysBetween, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Zap } from "lucide-react";

const statusBar: Record<Project["status"], string> = {
  on_track: "bg-status-on-track",
  delivered: "bg-status-planned",
  at_risk: "bg-status-slight",
  delayed: "bg-status-high",
};

export const GanttTimeline = ({ projects }: { projects: Project[] }) => {
  if (projects.length === 0) return null;
  const earliest = projects.reduce((min, p) => (new Date(p.startDate) < new Date(min) ? p.startDate : min), projects[0].startDate);
  const latest = projects.reduce((max, p) => {
    const end = new Date(p.newDate) > new Date(p.targetDate) ? p.newDate : p.targetDate;
    return new Date(end) > new Date(max) ? end : max;
  }, projects[0].targetDate);
  const totalDays = Math.max(daysBetween(earliest, latest), 30);
  const today = new Date().toISOString();
  const rawTodayPct = (daysBetween(earliest, today) / totalDays) * 100;
  // If today is out of range (demo data), use Feb 24 (day 49) as a fallback
  const todayPct = (rawTodayPct >= 0 && rawTodayPct <= 100) ? rawTodayPct : 54; 

  // week ticks
  const ticks: { pct: number; label: string }[] = [];
  for (let i = 0; i <= totalDays; i += 14) {
    const d = new Date(earliest);
    d.setDate(d.getDate() + i);
    ticks.push({ pct: (i / totalDays) * 100, label: fmtDate(d.toISOString()) });
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight">Quarter Timeline</h3>
          <p className="text-xs text-muted-foreground">Planned vs current delivery dates</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-muted" /> Planned</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-accent" /> Current</span>
        </div>
      </div>

      <div className="relative">
        {/* tick row */}
        <div className="relative ml-48 mb-2 h-4 border-b border-border/50">
          {ticks.map((t, i) => (
            <div key={i} className="absolute -translate-x-1/2 text-[10px] font-mono-num text-muted-foreground" style={{ left: `${t.pct}%` }}>
              {t.label}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {projects.map((p) => {
            const startPct = (daysBetween(earliest, p.startDate) / totalDays) * 100;
            const plannedW = (daysBetween(p.startDate, p.targetDate) / totalDays) * 100;
            const currentW = (daysBetween(p.startDate, p.newDate) / totalDays) * 100;
            const slipped = daysBetween(p.targetDate, p.newDate);
            return (
              <HoverCard key={p.id} openDelay={120}>
                <HoverCardTrigger asChild>
                  <div className="group flex items-center gap-2 rounded-md py-1.5 pr-2 transition-colors hover:bg-secondary/50">
                    <div className="w-48 shrink-0 truncate pr-2 text-xs">
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-1 text-muted-foreground">· {(p.productPoc ?? "—").split(" ")[0]}</span>
                    </div>
                    <div className="relative h-6 flex-1">
                      {/* Planned ghost bar */}
                      <div
                        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-sm bg-muted"
                        style={{ left: `${startPct}%`, width: `${Math.max(plannedW, 0.5)}%` }}
                      />
                      {/* Current solid bar */}
                      <div
                        className={cn("absolute top-1/2 h-3 -translate-y-1/2 rounded-md transition-all duration-500", statusBar[p.status])}
                        style={{ left: `${startPct}%`, width: `${Math.max(currentW, 0.5)}%`, opacity: 0.92 }}
                      />
                      {p.kind === "adhoc" && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-2 rounded-full bg-status-adhoc p-0.5 text-white shadow"
                          style={{ left: `${startPct}%` }}
                        >
                          <Zap className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="w-20 shrink-0 text-right text-[10px] font-mono-num">
                      {slipped > 0 ? <span className="text-status-high">+{slipped}d</span> : <span className="text-muted-foreground">on time</span>}
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 p-3" side="top">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">POC: {p.productPoc} · {p.category}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                    <div><div className="text-muted-foreground">Engineers</div><div className="font-mono-num font-medium">{p.currentResources.E}/{p.plannedResources.E}</div></div>
                    <div><div className="text-muted-foreground">Testers</div><div className="font-mono-num font-medium">{p.currentResources.T}/{p.plannedResources.T}</div></div>
                    <div><div className="text-muted-foreground">Designers</div><div className="font-mono-num font-medium">{p.currentResources.D}/{p.plannedResources.D}</div></div>
                  </div>
                  <div className="mt-2 border-t pt-2 text-[11px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-mono-num">{fmtDate(p.targetDate)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">New</span><span className="font-mono-num">{fmtDate(p.newDate)}</span></div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>

        {/* Today line */}
        <div className="pointer-events-none absolute top-0 bottom-0 ml-48" style={{ left: `${todayPct}%` }}>
          <div className="absolute top-0 bottom-0 w-0.5 bg-status-high shadow-[0_0_8px_rgba(232,64,64,0.4)]" />
          <div className="absolute -top-1 -translate-x-1/2 rounded-sm bg-status-high px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">Today</div>
        </div>
      </div>
    </div>
  );
};
