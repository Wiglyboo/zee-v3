export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const addDays = (iso: string, days: number) => {
  const x = new Date(iso);
  x.setDate(x.getDate() + days);
  return x.toISOString();
};

export const reasonLabel: Record<string, string> = {
  scope_change: "Scope change",
  tech_feasibility: "Tech feasibility",
  estimation: "Estimation increase",
  adhoc: "Ad-hoc project",
};
