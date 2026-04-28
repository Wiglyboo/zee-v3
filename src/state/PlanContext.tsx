import React, { createContext, useContext, useReducer, useMemo } from "react";
import { Project, AdhocRequest, AuditEntry, Quarter, ImpactedProject, DelayReason, deriveStatus } from "@/lib/types";
import { seedProjects, seedRequests, seedAudit } from "@/lib/seed";

interface State {
  projects: Project[];
  requests: AdhocRequest[];
  audit: AuditEntry[];
  quarter: Quarter;
}

type Action =
  | { type: "SET_QUARTER"; quarter: Quarter }
  | { type: "CREATE_PROJECT"; project: Project; actor: string }
  | { type: "UPDATE_PROJECT"; project: Project; actor: string }
  | { type: "UPDATE_DELIVERY"; projectId: string; newDate: string; reason: DelayReason; actor: string }
  | { type: "CREATE_REQUEST"; request: AdhocRequest }
  | { type: "DECIDE"; requestId: string; decision: "approved" | "rejected"; comment?: string; actor: string };

const initial: State = {
  projects: seedProjects,
  requests: seedRequests,
  audit: seedAudit,
  quarter: "Q1",
};

const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_QUARTER":
      return { ...state, quarter: action.quarter };

    case "CREATE_PROJECT": {
      const audit: AuditEntry = {
        id: newId("a"), timestamp: new Date().toISOString(), actor: action.actor,
        type: "project_created", summary: `Created project: ${action.project.name}`, projectId: action.project.id,
      };
      return { ...state, projects: [action.project, ...state.projects], audit: [audit, ...state.audit] };
    }

    case "UPDATE_PROJECT": {
      const audit: AuditEntry = {
        id: newId("a"), timestamp: new Date().toISOString(), actor: action.actor,
        type: "project_updated", summary: `Updated project: ${action.project.name}`, projectId: action.project.id,
      };
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.project.id ? action.project : p)),
        audit: [audit, ...state.audit],
      };
    }

    case "UPDATE_DELIVERY": {
      const proj = state.projects.find((p) => p.id === action.projectId);
      if (!proj) return state;
      const fromDate = proj.newDate;
      const updated: Project = {
        ...proj,
        newDate: action.newDate,
        delayReason: action.reason,
        status: deriveStatus(proj.targetDate, action.newDate, proj.status === "delivered"),
        deliveryHistory: [
          { id: newId("h"), timestamp: new Date().toISOString(), fromDate, toDate: action.newDate, reason: action.reason, actor: action.actor },
          ...proj.deliveryHistory,
        ],
      };
      const audit: AuditEntry = {
        id: newId("a"), timestamp: new Date().toISOString(), actor: action.actor,
        type: "delivery_updated", summary: `${proj.name} delivery updated (${action.reason.replace("_", " ")})`, projectId: proj.id,
      };
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === proj.id ? updated : p)),
        audit: [audit, ...state.audit],
      };
    }

    case "CREATE_REQUEST": {
      const audit: AuditEntry = {
        id: newId("a"), timestamp: new Date().toISOString(), actor: action.request.requestedBy,
        type: "request_created", summary: `Raised ad-hoc request: ${action.request.title}`, requestId: action.request.id,
      };
      return { ...state, requests: [action.request, ...state.requests], audit: [audit, ...state.audit] };
    }

    case "DECIDE": {
      const req = state.requests.find((r) => r.id === action.requestId);
      if (!req) return state;
      const updatedReq: AdhocRequest = {
        ...req, status: action.decision,
        decidedAt: new Date().toISOString(), decidedBy: action.actor, decisionComment: action.comment,
      };
      let projects = state.projects;
      const newAudit: AuditEntry[] = [{
        id: newId("a"), timestamp: new Date().toISOString(), actor: action.actor,
        type: action.decision, summary: `${action.decision === "approved" ? "Approved" : "Rejected"} ${req.title}`, requestId: req.id,
      }];
      if (action.decision === "approved") {
        projects = state.projects.map((p) => {
          const impact = req.impacts.find((i) => i.projectId === p.id);
          if (!impact) return p;
          newAudit.push({
            id: newId("a"), timestamp: new Date().toISOString(), actor: "system",
            type: "timeline_shift", summary: `${p.name} shifted by +${impact.delayDays} days`, requestId: req.id, projectId: p.id,
          });
          return {
            ...p,
            newDate: impact.newDate,
            delayReason: "adhoc",
            status: deriveStatus(p.targetDate, impact.newDate, p.status === "delivered"),
            impactedBy: [...(p.impactedBy ?? []), req.id],
            deliveryHistory: [
              { id: newId("h"), timestamp: new Date().toISOString(), fromDate: p.newDate, toDate: impact.newDate, reason: "adhoc", actor: action.actor, requestId: req.id },
              ...p.deliveryHistory,
            ],
          };
        });
      }
      return {
        ...state,
        requests: state.requests.map((r) => (r.id === req.id ? updatedReq : r)),
        projects,
        audit: [...newAudit, ...state.audit],
      };
    }
    default:
      return state;
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export const PlanProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const usePlan = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
};
