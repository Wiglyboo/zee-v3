export type Category = "Subscription" | "Personalization" | "Ads" | "Discovery" | "Engagement" | "Miscellaneous" | "Linear" | "AI";
export type ProjectStatus = "on_track" | "at_risk" | "delayed" | "delivered";
export type ProjectKind = "planned" | "adhoc";
export type Priority = 1 | 2 | 3;
export type Urgency = "low" | "medium" | "high";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type DelayReason = "scope_change" | "tech_feasibility" | "estimation" | "adhoc";

export interface Resources {
  E: number;
  T: number;
  D: number;
}

export interface DeliveryHistoryEntry {
  id: string;
  timestamp: string;
  fromDate: string;
  toDate: string;
  reason: DelayReason;
  actor: string;
  requestId?: string;
}

export interface Project {
  id: string;
  name: string;
  businessPoc: string;
  productPoc: string;
  successMetric: string;
  kind: ProjectKind;
  category: Category;
  priority: Priority;
  plannedResources: Resources;
  currentResources: Resources;
  targetDate: string; // original planned ISO
  newDate: string; // current ISO
  startDate: string;
  status: ProjectStatus;
  progress: number;
  delayReason?: DelayReason;
  impactedBy?: string[];
  quarter: Quarter;
  deliveryHistory: DeliveryHistoryEntry[];
}

export interface ImpactedProject {
  projectId: string;
  delayDays: number;
  newDate: string;
}

export interface AdhocRequest {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  successMetric: string;
  urgency: Urgency;
  category: Category;
  resources: Resources;
  targetDate: string;
  impacts: ImpactedProject[];
  status: "awaiting_reply" | "approved" | "rejected";
  createdAt: string;
  decisionDeadline: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionComment?: string;
  quarter: Quarter;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  type: "request_created" | "approved" | "rejected" | "timeline_shift" | "project_created" | "project_updated" | "delivery_updated";
  summary: string;
  details?: Record<string, unknown>;
  requestId?: string;
  projectId?: string;
}

export const CATEGORIES: Category[] = ["Subscription", "Personalization", "Ads", "Discovery", "Engagement", "Miscellaneous", "Linear", "AI"];

export function deriveStatus(targetDate: string, newDate: string, delivered: boolean): ProjectStatus {
  if (delivered) return "delivered";
  const delay = Math.round((new Date(newDate).getTime() - new Date(targetDate).getTime()) / 86400000);
  if (delay <= 0) return "on_track";
  if (delay <= 7) return "at_risk";
  return "delayed";
}
