import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";
import { Counter } from "./Counter";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  icon: LucideIcon;
  accent?: "default" | "success" | "warning" | "adhoc";
}

const accentMap = {
  default: "from-accent/15 to-transparent text-accent",
  success: "from-status-on-track/15 to-transparent text-status-on-track",
  warning: "from-status-slight/15 to-transparent text-status-slight",
  adhoc: "from-status-adhoc/15 to-transparent text-status-adhoc",
};

export const KpiCard = ({ label, value, suffix = "%", delta, icon: Icon, accent = "default" }: Props) => {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 shadow-sm card-hover">
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-60 blur-2xl", accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
            <Counter value={value} suffix={suffix} />
          </p>
          {delta !== undefined && (
            <div className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", positive ? "text-status-on-track" : "text-status-high")}>
              {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              <span className="font-mono-num">{Math.abs(delta)}%</span>
              <span className="text-muted-foreground">vs last quarter</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-2", accentMap[accent].replace("from-", "bg-").split(" ")[0].replace("/15", "/10"))}>
          <Icon className={cn("h-4 w-4", accentMap[accent].split(" ").pop())} />
        </div>
      </div>
    </div>
  );
};
