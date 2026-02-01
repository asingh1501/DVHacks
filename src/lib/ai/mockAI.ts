import { AIAnalysisResult, DocType, ChecklistItem, DraftEmail, RiskFlag, SuggestedAction, Entities } from "@/lib/types";
import { detectDocumentType, detectOwnerTeam, detectPriority } from "./analyzer";

// Mock response templates for each document type
const MOCK_TEMPLATES: Record<DocType, Partial<AIAnalysisResult>> = {
  invoice: {
    summary: "This is an invoice document requesting payment for goods or services rendered. The document contains billing details, line items, and payment terms.",
    requiredFieldsMissing: ["Purchase order reference"],
    riskFlags: [
      { flag: "missing_po", severity: "warning", description: "No purchase order number referenced" },
    ],
    recommendedActions: [
      { type: "checklist", title: "Process Invoice", priority: "medium", stepsOrBody: ["Verify vendor details", "Match to PO", "Approve for payment"] },
    ],
    suggestedTags: ["invoice", "accounts-payable", "pending-payment"],
    estimatedProcessingTime: "2-3 business days",
  },
  contract: {
    summary: "This is a contractual agreement document outlining terms, conditions, and obligations between parties. Review required before execution.",
    requiredFieldsMissing: ["Signature date", "Notarization"],
    riskFlags: [
      { flag: "legal_review", severity: "info", description: "Legal review recommended before signing" },
      { flag: "missing_signatures", severity: "warning", description: "Document appears to be unsigned" },
    ],
    recommendedActions: [
      { type: "approval_request", title: "Legal Review Required", priority: "high", stepsOrBody: ["Route to legal team", "Obtain stakeholder approval", "Schedule signing"] },
    ],
    suggestedTags: ["contract", "legal", "requires-review"],
    estimatedProcessingTime: "5-7 business days",
  },
  resume: {
    summary: "This is a candidate resume/CV document containing professional experience, education, and skills information for employment consideration.",
    requiredFieldsMissing: [],
    riskFlags: [],
    recommendedActions: [
      { type: "checklist", title: "Review Candidate", priority: "medium", stepsOrBody: ["Screen qualifications", "Schedule interview", "Update ATS"] },
    ],
    suggestedTags: ["resume", "candidate", "hiring"],
    estimatedProcessingTime: "1-2 business days",
  },
  incident_report: {
    summary: "This is an incident report documenting an event that requires investigation and follow-up action. Immediate review recommended.",
    requiredFieldsMissing: ["Root cause analysis"],
    riskFlags: [
      { flag: "security_incident", severity: "critical", description: "May require immediate security review" },
      { flag: "incomplete_report", severity: "warning", description: "Root cause analysis not included" },
    ],
    recommendedActions: [
      { type: "escalation", title: "Incident Response", priority: "high", stepsOrBody: ["Investigate incident", "Document findings", "Implement remediation"] },
    ],
    suggestedTags: ["incident", "security", "urgent"],
    estimatedProcessingTime: "1 business day",
  },
  meeting_notes: {
    summary: "These are meeting notes containing discussion points, decisions made, and action items. Follow-up on action items recommended.",
    requiredFieldsMissing: [],
    riskFlags: [],
    recommendedActions: [
      { type: "reminder", title: "Follow Up on Action Items", priority: "medium", stepsOrBody: ["Distribute notes", "Track action items", "Schedule follow-up"] },
    ],
    suggestedTags: ["meeting", "notes", "action-items"],
    estimatedProcessingTime: "Same day",
  },
  policy: {
    summary: "This is a policy document outlining organizational guidelines and procedures. Compliance review and distribution may be required.",
    requiredFieldsMissing: ["Approval date", "Review cycle"],
    riskFlags: [
      { flag: "compliance_review", severity: "info", description: "Annual compliance review may be due" },
    ],
    recommendedActions: [
      { type: "checklist", title: "Policy Compliance", priority: "low", stepsOrBody: ["Review policy content", "Update if needed", "Distribute to stakeholders"] },
    ],
    suggestedTags: ["policy", "compliance", "documentation"],
    estimatedProcessingTime: "3-5 business days",
  },
  email: {
    summary: "This is an email correspondence requiring attention. Review content and respond as appropriate.",
    requiredFieldsMissing: [],
    riskFlags: [],
    recommendedActions: [
      { type: "draft_email", title: "Respond to Email", priority: "medium", stepsOrBody: ["Review content", "Draft response", "Send reply"] },
    ],
    suggestedTags: ["email", "correspondence"],
    estimatedProcessingTime: "Same day",
  },
  purchase_order: {
    summary: "This is a purchase order document for procurement of goods or services. Processing and approval required.",
    requiredFieldsMissing: ["Budget approval"],
    riskFlags: [
      { flag: "budget_check", severity: "warning", description: "Budget approval status unknown" },
    ],
    recommendedActions: [
      { type: "approval_request", title: "PO Approval", priority: "high", stepsOrBody: ["Verify budget", "Get manager approval", "Submit to vendor"] },
    ],
    suggestedTags: ["purchase-order", "procurement", "pending-approval"],
    estimatedProcessingTime: "2-3 business days",
  },
  proposal: {
    summary: "This is a business proposal document outlining a project scope, timeline, and budget. Review and stakeholder decision required.",
    requiredFieldsMissing: ["Client signature"],
    riskFlags: [
      { flag: "pending_review", severity: "info", description: "Proposal awaiting stakeholder review" },
    ],
    recommendedActions: [
      { type: "approval_request", title: "Proposal Review", priority: "high", stepsOrBody: ["Review scope", "Discuss with team", "Present to client"] },
    ],
    suggestedTags: ["proposal", "sales", "pending-decision"],
    estimatedProcessingTime: "5-7 business days",
  },
  other: {
    summary: "This document has been analyzed but could not be classified into a specific category. Manual review recommended.",
    requiredFieldsMissing: [],
    riskFlags: [
      { flag: "unclassified", severity: "info", description: "Document type could not be automatically determined" },
    ],
    recommendedActions: [
      { type: "checklist", title: "Manual Review", priority: "medium", stepsOrBody: ["Review document", "Classify manually", "Route appropriately"] },
    ],
    suggestedTags: ["unclassified", "needs-review"],
    estimatedProcessingTime: "1-2 business days",
  },
};

// Entity extraction using regex patterns
function extractEntities(text: string): Entities {
  const entities: Entities = {
    people: [],
    organizations: [],
    dates: [],
    amounts: [],
    ids: [],
    locations: [],
    emails: [],
    phones: [],
  };

  // Extract emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
  entities.emails = [...new Set(text.match(emailRegex) || [])];

  // Extract phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
  entities.phones = [...new Set(text.match(phoneRegex) || [])];

  // Extract amounts (currency)
  const amountRegex = /\$[\d,]+(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|dollars?)/gi;
  entities.amounts = [...new Set(text.match(amountRegex) || [])];

  // Extract dates
  const dateRegex = /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/gi;
  entities.dates = [...new Set(text.match(dateRegex) || [])];

  // Extract IDs (invoice numbers, PO numbers, etc.)
  const idRegex = /(?:INV|PO|REF|ID|ORDER|TICKET|CASE)[-#]?\s*\d+[\w-]*/gi;
  entities.ids = [...new Set(text.match(idRegex) || [])];

  // Extract potential company/organization names (capitalized phrases)
  const orgRegex = /(?:[A-Z][a-z]+ )+(?:Inc\.?|LLC|Corp\.?|Ltd\.?|Company|Co\.?|Corporation|Group|Partners|Associates)/g;
  entities.organizations = [...new Set(text.match(orgRegex) || [])];

  // Extract potential people names (Mr./Ms./Dr. followed by name)
  const personRegex = /(?:Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g;
  entities.people = [...new Set(text.match(personRegex) || [])];

  // Extract locations (common patterns)
  const locationRegex = /\b(?:\d+\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:CA|NY|TX|FL|WA|IL|PA|OH|GA|NC|MI|NJ|VA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|UT|NV|AR|MS|KS|NM|NE|WV|ID|HI|NH|ME|RI|MT|DE|SD|ND|AK|VT|WY|DC)\b/g;
  entities.locations = [...new Set(text.match(locationRegex) || [])];

  return entities;
}

// Generate checklist based on document type
function generateChecklist(docType: DocType, entities: Entities): ChecklistItem[] {
  const baseChecklist: ChecklistItem[] = [
    { id: "1", task: "Review document content", completed: false },
    { id: "2", task: "Verify extracted information", completed: false },
    { id: "3", task: "Take required action", completed: false },
  ];

  const typeSpecificTasks: Partial<Record<DocType, ChecklistItem[]>> = {
    invoice: [
      { id: "inv-1", task: "Verify vendor information", completed: false },
      { id: "inv-2", task: "Match to purchase order", completed: false },
      { id: "inv-3", task: "Verify amounts and calculations", completed: false },
      { id: "inv-4", task: "Submit for approval", completed: false },
      { id: "inv-5", task: "Schedule payment", completed: false },
    ],
    contract: [
      { id: "con-1", task: "Review terms and conditions", completed: false },
      { id: "con-2", task: "Identify key obligations", completed: false },
      { id: "con-3", task: "Get legal review", completed: false },
      { id: "con-4", task: "Obtain necessary approvals", completed: false },
      { id: "con-5", task: "Execute document", completed: false },
    ],
    resume: [
      { id: "res-1", task: "Screen qualifications", completed: false },
      { id: "res-2", task: "Compare to job requirements", completed: false },
      { id: "res-3", task: "Schedule interview", completed: false },
      { id: "res-4", task: "Update applicant tracking system", completed: false },
    ],
    incident_report: [
      { id: "inc-1", task: "Acknowledge incident", completed: false },
      { id: "inc-2", task: "Investigate root cause", completed: false },
      { id: "inc-3", task: "Document findings", completed: false },
      { id: "inc-4", task: "Implement remediation", completed: false },
      { id: "inc-5", task: "Close incident", completed: false },
    ],
    purchase_order: [
      { id: "po-1", task: "Verify budget availability", completed: false },
      { id: "po-2", task: "Get manager approval", completed: false },
      { id: "po-3", task: "Submit to vendor", completed: false },
      { id: "po-4", task: "Track delivery", completed: false },
    ],
  };

  return typeSpecificTasks[docType] || baseChecklist;
}

// Generate draft email based on document type
function generateDraftEmail(docType: DocType, entities: Entities, summary: string): DraftEmail {
  const emailTemplates: Partial<Record<DocType, DraftEmail>> = {
    invoice: {
      to: entities.emails.length > 0 ? entities.emails : ["vendor@example.com"],
      cc: [],
      subject: `RE: Invoice ${entities.ids[0] || "Reference"} - Processing Confirmation`,
      body: `Dear Team,

We have received and are processing the invoice${entities.ids[0] ? ` (${entities.ids[0]})` : ""}.

${entities.amounts.length > 0 ? `Amount: ${entities.amounts[0]}` : ""}

Please allow 2-3 business days for processing. If you have any questions, please don't hesitate to reach out.

Best regards`,
      tone: "professional",
    },
    contract: {
      to: entities.emails.length > 0 ? entities.emails : ["legal@example.com"],
      cc: [],
      subject: "Contract Review Request",
      body: `Dear Legal Team,

Please review the attached contract document. Key details:

${summary}

Please provide your assessment at your earliest convenience.

Best regards`,
      tone: "formal",
    },
    resume: {
      to: entities.emails.length > 0 ? entities.emails : ["candidate@example.com"],
      cc: ["hr@example.com"],
      subject: "Application Received - Next Steps",
      body: `Dear Candidate,

Thank you for your application. We have received your resume and are reviewing your qualifications.

We will be in touch within 5-7 business days regarding next steps.

Best regards,
HR Team`,
      tone: "professional",
    },
    incident_report: {
      to: ["it-security@example.com"],
      cc: ["management@example.com"],
      subject: "Incident Report - Immediate Attention Required",
      body: `Team,

An incident has been reported that requires immediate attention:

${summary}

Please review and coordinate the response effort.

Regards`,
      tone: "urgent",
    },
  };

  return emailTemplates[docType] || {
    to: entities.emails.length > 0 ? entities.emails : [],
    cc: [],
    subject: "Document Review Required",
    body: `Hello,

A document has been submitted for review:

${summary}

Please take appropriate action.

Best regards`,
    tone: "professional",
  };
}

export function getMockAnalysis(text: string, docTypeHint?: DocType): AIAnalysisResult {
  // Detect document type
  const docType = docTypeHint || detectDocumentType(text);
  const ownerTeam = detectOwnerTeam(docType, text);
  const priority = detectPriority(text);

  // Extract entities from text
  const entities = extractEntities(text);

  // Get template for document type
  const template = MOCK_TEMPLATES[docType] || MOCK_TEMPLATES.other;

  // Generate dynamic content
  const checklist = generateChecklist(docType, entities);
  const summary = template.summary || `This document has been classified as ${docType}.`;
  const draftEmail = generateDraftEmail(docType, entities, summary);

  // Calculate confidence based on how well the document matches the type
  const confidence = docType === "other" ? 0.65 : 0.85 + Math.random() * 0.1;

  const decisionSignals = generateDecisionSignals(text, docType, ownerTeam, priority, entities);

  return {
    docType,
    summary,
    entities,
    ownerTeam,
    priority,
    requiredFieldsMissing: template.requiredFieldsMissing || [],
    riskFlags: template.riskFlags || [],
    complianceIssues: template.complianceIssues,
    recommendedActions: template.recommendedActions || [],
    checklist,
    draftEmail,
    confidence,
    rationale: `Document classified as ${docType} based on content analysis. Assigned to ${ownerTeam} team with ${priority} priority due to content indicators.`,
    decisionSignals,
    suggestedTags: template.suggestedTags || [docType],
    estimatedProcessingTime: template.estimatedProcessingTime || "2-3 business days",
  };
}

function generateDecisionSignals(
  text: string,
  docType: DocType,
  ownerTeam: string,
  priority: string,
  entities: Entities
): string[] {
  const lowerText = text.toLowerCase();
  const signals: string[] = [];

  if (docType === "contract" && /agreement|terms|obligations|parties|whereas/.test(lowerText)) {
    signals.push("Detected contract-style language (terms, obligations, parties).");
  }
  if (docType === "invoice" && /invoice|amount due|payment terms|bill to/.test(lowerText)) {
    signals.push("Found billing cues like invoice terms and payment language.");
  }
  if (docType === "purchase_order" && /purchase order|po#|vendor|unit price/.test(lowerText)) {
    signals.push("Purchase order indicators present (PO references, vendor, unit price).");
  }
  if (docType === "resume" && /experience|education|skills|employment/.test(lowerText)) {
    signals.push("Resume-like sections detected (experience, education, skills).");
  }
  if (docType === "incident_report" && /incident|root cause|severity|affected/.test(lowerText)) {
    signals.push("Incident language detected (severity, root cause, affected systems).");
  }

  if (ownerTeam === "Unknown") {
    signals.push("No explicit department keywords found for routing.");
  } else if (ownerTeam === "Legal") {
    signals.push("Legal terminology suggests routing to Legal.");
  } else if (ownerTeam === "AP" || ownerTeam === "Finance") {
    signals.push("Financial terms suggest routing to finance-related teams.");
  }

  if (priority === "urgent") {
    signals.push("Urgency inferred from terms like 'urgent', 'ASAP', or 'immediately'.");
  } else if (priority === "high") {
    signals.push("Deadline or high-priority wording suggests elevated urgency.");
  } else if (priority === "medium" && entities.dates.length > 0) {
    signals.push("Dates detected without explicit penalties; set to medium urgency.");
  }

  if (entities.dates.length > 0 && signals.length < 3) {
    signals.push("Document includes dates and timing indicators.");
  }
  if (entities.amounts.length > 0 && signals.length < 3) {
    signals.push("Monetary amounts detected in the document.");
  }

  if (signals.length === 0) {
    signals.push("Classification based on overall structure and keyword patterns.");
  }

  return Array.from(new Set(signals)).slice(0, 4);
}
