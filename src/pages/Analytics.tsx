import { usePlan } from "@/state/PlanContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

export default function Analytics() {
  const { state } = usePlan();
  const projects = state.projects.filter((p) => p.quarter === state.quarter);
  const delivered = projects.filter((p) => p.status === "delivered").length;
  const remaining = projects.length - delivered;
  const adhoc = projects.filter((p) => p.kind === "adhoc").length;
  const planned = projects.length - adhoc;

  const donutData = [
    { name: "Delivered", value: delivered, color: "hsl(var(--status-on-track))" },
    { name: "Remaining", value: remaining, color: "hsl(var(--muted))" },
  ];

  const stackedData = (["Q1", "Q2", "Q3", "Q4"] as const).map((q) => ({
    quarter: q,
    Planned: q === state.quarter ? planned : Math.round(8 + Math.random() * 4),
    Adhoc: q === state.quarter ? adhoc : Math.round(2 + Math.random() * 3),
  }));

  const lineData = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"].map((w, i) => ({
    week: w,
    delay: Math.round(2 + Math.sin(i / 2) * 3 + i * 0.4),
  }));

  const leaders = [...projects].sort((a, b) => (b.impactedBy?.length ?? 0) - (a.impactedBy?.length ?? 0)).slice(0, 5);

  return (
    <div className="container max-w-[1300px] space-y-6 px-6 py-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Trends across planning, delivery, and ad-hoc work</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold">Planned vs Delivered</h3>
          <p className="mb-3 text-xs text-muted-foreground">{state.quarter} 2025</p>
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-semibold">{Math.round((delivered / Math.max(projects.length, 1)) * 100)}%</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivered</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold">Ad-hoc vs Planned by Quarter</h3>
          <p className="mb-3 text-xs text-muted-foreground">Project mix over time</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Planned" stackId="a" fill="hsl(var(--status-planned))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Adhoc" stackId="a" fill="hsl(var(--status-adhoc))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold">Average Delay per Project</h3>
          <p className="mb-3 text-xs text-muted-foreground">Days slipped vs target</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="delay" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold">Most Impacted</h3>
          <p className="mb-3 text-xs text-muted-foreground">By ad-hoc work</p>
          <div className="space-y-2">
            {leaders.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-[10px] font-bold font-mono-num text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category}</p>
                </div>
                <span className="rounded-full bg-status-adhoc-soft px-2 py-0.5 text-[10px] font-bold text-status-adhoc font-mono-num">
                  {p.impactedBy?.length ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
