import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Category, Urgency, ImpactedProject, CATEGORIES } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { addDays, fmtDate, daysBetween } from "@/lib/format";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function NewRequest() {
  const navigate = useNavigate();
  const { state, dispatch } = usePlan();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [successMetric, setSuccessMetric] = useState("");
  const [category, setCategory] = useState<Category>("Subscription");
  const [urgency, setUrgency] = useState<Urgency>("medium");
  const [E, setE] = useState(1);
  const [T, setT] = useState(1);
  const [D, setD] = useState(0);
  const [targetDate, setTargetDate] = useState("");
  const [impacts, setImpacts] = useState<Record<string, number>>({});

  const suggested = useMemo(
    () => state.projects.filter((p) => p.category === category && p.status !== "delivered" && p.quarter === state.quarter),
    [state.projects, category, state.quarter]
  );

  const toggleImpact = (id: string, on: boolean) => {
    setImpacts((s) => {
      const next = { ...s };
      if (on) next[id] = 7;
      else delete next[id];
      return next;
    });
  };

  const totalDelay = Object.values(impacts).reduce((a, b) => a + b, 0);

  const submit = () => {
    if (!title.trim() || !targetDate) {
      toast.error("Title and target date required");
      return;
    }
    const id = `r${Date.now()}`;
    const now = new Date();
    const deadline = addDays(now.toISOString(), 3);
    const impactList: ImpactedProject[] = Object.entries(impacts).map(([projectId, delayDays]) => {
      const proj = state.projects.find((p) => p.id === projectId)!;
      return { projectId, delayDays, newDate: addDays(proj.newDate, delayDays) };
    });
    dispatch({
      type: "CREATE_REQUEST",
      request: {
        id, title, description: desc, successMetric, requestedBy: "Neha Verma", urgency, category,
        resources: { E, T, D }, targetDate: new Date(targetDate).toISOString(),
        impacts: impactList,
        status: "awaiting_reply", createdAt: now.toISOString(), decisionDeadline: deadline,
        quarter: state.quarter,
      },
    });
    toast(`📢 New request broadcast: ${title}`, { description: `Impacts ${impactList.length} project(s) · +${totalDelay}d total` });
    navigate(`/requests/${id}`);
  };

  return (
    <div className="container max-w-[860px] space-y-6 px-6 py-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New Ad-hoc Request</h1>
        <p className="mt-1 text-sm text-muted-foreground">Capture context and simulate impact before submitting.</p>
      </header>

      <div className="space-y-5 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project name</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="e.g. Compliance: New EU Ads Disclosure" />
        </div>
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1.5 min-h-[80px]" placeholder="Why is this needed?" />
        </div>
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Success metric impacted</Label>
          <Input value={successMetric} onChange={(e) => setSuccessMetric(e.target.value)} className="mt-1.5" placeholder="e.g. EU regulatory readiness" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as Category); setImpacts({}); }}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Urgency</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="mt-1.5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 rounded-lg border border-border/60 bg-secondary/30 p-4">
          {[
            { label: "Engineers", val: E, set: setE },
            { label: "Testers", val: T, set: setT },
            { label: "Designers", val: D, set: setD },
          ].map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium">{r.label}</span>
                <span className="font-mono-num font-semibold">{r.val}</span>
              </div>
              <Slider value={[r.val]} max={5} step={1} onValueChange={(v) => r.set(v[0])} />
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Suggested · {category} not yet delivered
            </Label>
            {Object.keys(impacts).length > 0 && (
              <span className="rounded-full bg-status-adhoc-soft px-2 py-0.5 text-[11px] font-semibold text-status-adhoc">
                {Object.keys(impacts).length} impacted · +{totalDelay}d total
              </span>
            )}
          </div>
          <div className="space-y-2">
            {suggested.length === 0 && <p className="text-xs text-muted-foreground">No matching projects.</p>}
            {suggested.map((p) => {
              const checked = impacts[p.id] !== undefined;
              const delay = impacts[p.id] ?? 0;
              const projected = checked ? addDays(p.newDate, delay) : p.newDate;
              return (
                <div key={p.id} className="rounded-lg border border-border/60 bg-background p-3">
                  <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <Checkbox checked={checked} onCheckedChange={(c) => toggleImpact(p.id, !!c)} />
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.productPoc}</span>
                  </label>
                  {checked && (
                    <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-4 border-t pt-3">
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Delay this project by</span>
                          <span className="font-mono-num font-semibold">{delay} days</span>
                        </div>
                        <Slider value={[delay]} max={45} step={1} min={0} onValueChange={(v) => setImpacts((s) => ({ ...s, [p.id]: v[0] }))} />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono-num">
                        <span className="rounded border bg-secondary px-2 py-1 text-muted-foreground line-through">{fmtDate(p.newDate)}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-status-adhoc" />
                        <span className="rounded border border-status-high/30 bg-status-high-soft px-2 py-1 font-semibold text-status-high">{fmtDate(projected)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => navigate("/requests")}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-to-r from-accent to-status-adhoc text-white">Broadcast Request</Button>
        </div>
      </div>
    </div>
  );
}
