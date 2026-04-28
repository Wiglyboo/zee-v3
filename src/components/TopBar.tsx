import { Bell, Plus } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/state/PlanContext";
import { Quarter } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { fmtDateTime } from "@/lib/format";

export const TopBar = () => {
  const { state, dispatch } = usePlan();
  const navigate = useNavigate();
  const pending = state.requests.filter((r) => r.status === "awaiting_reply");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 glass px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="h-6 w-px bg-border" />
      <Select value={state.quarter} onValueChange={(v) => dispatch({ type: "SET_QUARTER", quarter: v as Quarter })}>
        <SelectTrigger className="h-8 w-[110px] border-border/60 bg-background/60 text-sm font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["Q1", "Q2", "Q3", "Q4"] as Quarter[]).map((q) => (
            <SelectItem key={q} value={q}>{q} 2025</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" onClick={() => navigate("/requests/new")} className="h-8 gap-1.5 bg-gradient-to-r from-accent to-status-adhoc text-white shadow-sm hover:opacity-95">
          <Plus className="h-3.5 w-3.5" /> New Request
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {pending.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-high px-1 text-[9px] font-bold text-white">
                  {pending.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notifications</p>
            </div>
            <div className="max-h-80 overflow-auto">
              {pending.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">All caught up ✨</p>
              )}
              {pending.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/requests/${r.id}`)}
                  className="block w-full border-b border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
                >
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.requestedBy} · {fmtDateTime(r.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-gradient-to-br from-accent to-status-adhoc text-xs text-white">NV</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
