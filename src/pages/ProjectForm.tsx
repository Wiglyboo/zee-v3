import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category, Priority, Project, deriveStatus, CATEGORIES } from "@/lib/types";
import { toast } from "sonner";

const newId = () => `p${Date.now().toString(36)}`;

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state, dispatch } = usePlan();
  const existing = id ? state.projects.find((p) => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<Category>(existing?.category ?? "Subscription");
  const [businessPoc, setBusinessPoc] = useState(existing?.businessPoc ?? "");
  const [productPoc, setProductPoc] = useState(existing?.productPoc ?? "");
  const [successMetric, setSuccessMetric] = useState(existing?.successMetric ?? "");
  const [targetDate, setTargetDate] = useState(existing?.targetDate.slice(0, 10) ?? "");
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 2);
  const [E, setE] = useState(existing?.plannedResources.E ?? 2);
  const [T, setT] = useState(existing?.plannedResources.T ?? 1);
  const [D, setD] = useState(existing?.plannedResources.D ?? 1);
  const [delivered, setDelivered] = useState(existing?.status === "delivered");

  const submit = () => {
    if (!name.trim() || !targetDate || !productPoc.trim()) {
      toast.error("Name, Product POC, and target date are required");
      return;
    }
    const iso = new Date(targetDate).toISOString();
    if (existing) {
      const updated: Project = {
        ...existing, name, category, businessPoc, productPoc, successMetric, priority,
        targetDate: iso,
        plannedResources: { E, T, D },
        currentResources: existing.currentResources,
        status: deriveStatus(iso, existing.newDate, delivered),
      };
      dispatch({ type: "UPDATE_PROJECT", project: updated, actor: "Neha Verma" });
      toast.success("Project updated");
      navigate(`/projects/${existing.id}`);
    } else {
      const project: Project = {
        id: newId(), name, category, kind: "planned", businessPoc, productPoc, successMetric, priority,
        plannedResources: { E, T, D }, currentResources: { E, T, D },
        startDate: new Date().toISOString(), targetDate: iso, newDate: iso,
        status: deriveStatus(iso, iso, delivered), progress: 0,
        quarter: state.quarter, deliveryHistory: [],
      };
      dispatch({ type: "CREATE_PROJECT", project, actor: "Neha Verma" });
      toast.success("Project created");
      navigate(`/projects/${project.id}`);
    }
  };

  return (
    <div className="container max-w-[760px] space-y-6 px-6 py-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{existing ? "Edit Project" : "New Project"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Capture intent, owners, and resourcing.</p>
      </header>

      <div className="space-y-5 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Project name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" placeholder="e.g. Personalized Hero Rail" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</Label>
            <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v) as Priority)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">P1 — Critical</SelectItem>
                <SelectItem value="2">P2 — High</SelectItem>
                <SelectItem value="3">P3 — Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Business POC</Label>
            <Input value={businessPoc} onChange={(e) => setBusinessPoc(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Product POC</Label>
            <Input value={productPoc} onChange={(e) => setProductPoc(e.target.value)} className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Success metric</Label>
          <Input value={successMetric} onChange={(e) => setSuccessMetric(e.target.value)} className="mt-1.5" placeholder="e.g. +10% activation rate" />
        </div>

        <div>
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Planned delivery date</Label>
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="mt-1.5" />
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
              <Slider value={[r.val]} max={6} step={1} onValueChange={(v) => r.set(v[0])} />
            </div>
          ))}
        </div>

        {existing && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={delivered} onChange={(e) => setDelivered(e.target.checked)} />
            Mark as delivered
          </label>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={submit} className="bg-gradient-to-r from-accent to-status-adhoc text-white">
            {existing ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
