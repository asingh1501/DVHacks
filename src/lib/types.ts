// DocOps Copilot - Type Definitions

export type DocType =
  | "invoice"
  | "contract"
  | "resume"
  | "incident_report"
  | "meeting_notes"
  | "policy"
  | "email"
  | "purchase_order"
  | "proposal"
  | "other";

export type OwnerTeam =
  | "AP"
  | "Legal"
  | "HR"
  | "Ops"
  | "Support"
  | "Sales"
  | "IT"
  | "Finance"
  | "Procurement"
  | "Unknown";

export type Priority = "low" | "medium" | "high" | "urgent";

export type RiskSeverity = "info" | "warning" | "critical";

export type CaseStatus =
  | "new"
  | "in_progress"
  | "pending_review"
  | "resolved"
  | "archived";

export type NoteType = "general" | "decision" | "followup" | "escalation";

export type AuditEventType =
  | "analyzed"
  | "created"
  | "edited"
  | "status_changed"
  | "assigned"
  | "note_added"
  | "email_sent";

export interface Entities {
  people: string[];
  organizations: string[];
  dates: string[];
  amounts: string[];
  ids: string[];
  locations: string[];
  emails: string[];
  phones: string[];
}

export interface RiskFlag {
  flag: string;
  severity: RiskSeverity;
  description: string;
}

export interface ComplianceIssue {
  issue: string;
  regulation: string;
  recommendation: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  description?: string;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
  dependencies?: string[];
}

export interface DraftEmail {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  tone: "formal" | "professional" | "friendly" | "urgent";
  suggestedAttachments?: string[];
}

export interface SuggestedAction {
  type: "checklist" | "draft_email" | "approval_request" | "escalation" | "reminder";
  title: string;
  priority: Priority;
  stepsOrBody: string[];
  dueDate?: string;
}

export interface AIAnalysisResult {
  docType: DocType;
  summary: string;
  entities: Entities;
  ownerTeam: OwnerTeam;
  priority: Priority;
  requiredFieldsMissing: string[];
  riskFlags: RiskFlag[];
  complianceIssues?: ComplianceIssue[];
  recommendedActions: SuggestedAction[];
  checklist: ChecklistItem[];
  draftEmail: DraftEmail;
  confidence: number;
  rationale: string;
  suggestedTags: string[];
  estimatedProcessingTime?: string;
}

// Case with parsed JSON fields
export interface CaseWithRelations {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  fileName: string | null;
  fileType: string | null;
  originalText: string;
  documentHash: string;
  docType: DocType;
  summary: string;
  entities: Entities;
  ownerTeam: OwnerTeam;
  priority: Priority;
  confidence: number;
  aiRationale: string;
  missingFields: string[];
  riskFlags: RiskFlag[];
  complianceIssues: ComplianceIssue[] | null;
  checklist: ChecklistItem[];
  draftEmail: DraftEmail;
  suggestedActions: SuggestedAction[];
  userEdits: Record<string, unknown> | null;
  editedFields: Record<string, unknown> | null;
  status: CaseStatus;
  assignedTo: string | null;
  tags: string[];
  auditEvents?: AuditEventWithParsed[];
  notes?: CaseNoteWithParsed[];
  attachments?: AttachmentWithParsed[];
}

export interface AuditEventWithParsed {
  id: string;
  createdAt: Date;
  caseId: string;
  eventType: AuditEventType;
  actor: string;
  description: string;
  metadata: Record<string, unknown> | null;
  changes: Record<string, unknown> | null;
}

export interface CaseNoteWithParsed {
  id: string;
  createdAt: Date;
  caseId: string;
  content: string;
  author: string;
  noteType: NoteType;
}

export interface AttachmentWithParsed {
  id: string;
  createdAt: Date;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter/Query types
export interface CasesFilter {
  team?: OwnerTeam;
  priority?: Priority;
  status?: CaseStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
