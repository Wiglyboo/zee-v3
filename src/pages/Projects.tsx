import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePlan } from "@/state/PlanContext";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { ProjectTable } from "@/components/ProjectTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/types";

export default function Projects() {
  const { state } = usePlan();
  const navigate = useNavigate();
  const [cat, setCat] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");

  const list = state.projects
    .filter((p) => p.quarter === state.quarter)
    .filter((p) => cat === "all" || p.category === cat)
    .filter((p) => kind === "all" || p.kind === kind)
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className="container max-w-[1400px] space-y-6 px-6 py-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage planned work · {list.length} projects</p>
        </div>
        <Button onClick={() => navigate("/projects/new")} className="gap-1.5 bg-gradient-to-r from-accent to-status-adhoc text-white">
          <Plus className="h-4 w-4" /> New Project
        </Button>
      </header>

      <div className="flex items-center gap-2">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="adhoc">Ad-hoc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {list.length > 0 ? (
        <ProjectTable projects={list} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-semibold">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first planned project.</p>
          <Button onClick={() => navigate("/projects/new")} className="mt-4 gap-1.5">
            <Plus className="h-4 w-4" /> New Project <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
