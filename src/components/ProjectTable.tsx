import { Project } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KindPill, PriorityChip, StatusPill } from "./StatusBadge";
import { fmtDate, daysBetween, reasonLabel } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const ResourceDelta = ({ planned, current, label }: { planned: number; current: number; label: string }) => {
  const diff = current - planned;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded border border-border/60 bg-secondary/60 px-1.5 py-0.5 text-[10px] font-mono-num">
          <span className="font-semibold text-muted-foreground">{label}</span>
          <span>{planned}</span>
          {diff !== 0 && (
            <>
              <span className="text-muted-foreground">→</span>
              <span className={cn("font-semibold", diff < 0 ? "text-status-high" : "text-status-on-track")}>{current}</span>
            </>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label === "E" ? "Engineers" : label === "T" ? "Testers" : "Designers"}: planned {planned}, current {current}</TooltipContent>
    </Tooltip>
  );
};

export const ProjectTable = ({ projects }: { projects: Project[] }) => (
  <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm animate-fade-in">
    <Table>
      <TableHeader>
        <TableRow className="bg-secondary/40 hover:bg-secondary/40">
          <TableHead className="w-[28%]">Project</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Resources</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead className="w-[18%]">Progress</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => {
          const slipped = daysBetween(p.targetDate, p.newDate);
          return (
            <TableRow key={p.id} className="group">
              <TableCell>
                <Link to={`/projects/${p.id}`} className="flex items-start gap-3 hover:opacity-80">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-secondary text-[10px] font-medium">
                      {p.productPoc.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{p.name}</span>
                      <PriorityChip priority={p.priority} />
                      {p.impactedBy && p.impactedBy.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger><Zap className="h-3.5 w-3.5 text-status-adhoc" /></TooltipTrigger>
                          <TooltipContent>Impacted by ad-hoc request</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.productPoc}</span>
                      <KindPill kind={p.kind} />
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <span className="rounded-md border border-border/60 bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{p.category}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <ResourceDelta planned={p.plannedResources.E} current={p.currentResources.E} label="E" />
                  <ResourceDelta planned={p.plannedResources.T} current={p.currentResources.T} label="T" />
                  <ResourceDelta planned={p.plannedResources.D} current={p.currentResources.D} label="D" />
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-mono-num">
                    <span className="text-muted-foreground">TD</span>
                    <span>{fmtDate(p.targetDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono-num">
                    <span className="text-muted-foreground">ND</span>
                    <span className={cn(slipped > 0 && "text-status-high font-medium")}>{fmtDate(p.newDate)}</span>
                    {slipped > 0 && <span className="text-status-high">+{slipped}d</span>}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        p.status === "delivered" && "bg-status-planned",
                        p.status === "on_track" && "bg-status-on-track",
                        p.status === "at_risk" && "bg-status-slight",
                        p.status === "delayed" && "bg-status-high"
                      )}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono-num">{p.progress}%</span>
                    {p.delayReason && <span>{reasonLabel[p.delayReason]}</span>}
                  </div>
                </div>
              </TableCell>
              <TableCell><StatusPill status={p.status} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
