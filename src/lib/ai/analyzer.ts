import Groq from "groq-sdk";
import { AIAnalysisResult, DocType, OwnerTeam, Priority } from "@/lib/types";
import { getMockAnalysis } from "./mockAI";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const AI_SYSTEM_PROMPT = `You are an expert document analyst for SLATE, Walmart's AI-powered document intelligence platform.
Your task is to analyze documents and extract structured information.

Analyze the document and provide:
1. Document type classification
2. Executive summary (2-3 sentences)
3. All extracted entities (people, organizations, dates, amounts, IDs, locations, emails, phones)
4. Recommended owner team for handling this document
5. Priority level based on urgency indicators
6. List of required fields that are missing
7. Risk flags with severity levels
8. Compliance issues if applicable
9. Recommended actions and checklist items
10. Draft email for follow-up if applicable

Be thorough but concise. Focus on actionable insights.`;

const AI_USER_PROMPT = (text: string) => `Analyze the following document and provide a structured analysis:

---
${text}
---

Respond with a JSON object matching this exact schema:
{
  "docType": "invoice|contract|resume|incident_report|meeting_notes|policy|email|purchase_order|proposal|other",
  "summary": "2-3 sentence executive summary",
  "entities": {
    "people": ["names"],
    "organizations": ["company names"],
    "dates": ["ISO dates or date strings found"],
    "amounts": ["money amounts with currency"],
    "ids": ["invoice numbers, PO numbers, IDs"],
    "locations": ["addresses, cities"],
    "emails": ["email addresses"],
    "phones": ["phone numbers"]
  },
  "ownerTeam": "AP|Legal|HR|Ops|Support|Sales|IT|Finance|Procurement|Unknown",
  "priority": "low|medium|high|urgent",
  "requiredFieldsMissing": ["list of required fields not found"],
  "riskFlags": [{"flag": "short_id", "severity": "info|warning|critical", "description": "why flagged"}],
  "complianceIssues": [{"issue": "issue", "regulation": "e.g. GDPR", "recommendation": "action"}],
  "recommendedActions": [{"type": "checklist|draft_email|approval_request|escalation|reminder", "title": "action title", "priority": "low|medium|high", "stepsOrBody": ["steps or paragraphs"], "dueDate": "ISO date if time-sensitive"}],
  "checklist": [{"id": "unique_id", "task": "task description", "description": "optional details", "completed": false, "assignee": "optional", "dueDate": "optional ISO date"}],
  "draftEmail": {"to": ["recipients"], "cc": [], "subject": "subject line", "body": "email body in markdown", "tone": "formal|professional|friendly|urgent"},
  "confidence": 0.0-1.0,
  "rationale": "2-3 sentences explaining classification decisions",
  "decisionSignals": ["3-5 short bullet statements justifying docType, ownerTeam, and priority"],
  "suggestedTags": ["relevant tags"],
  "estimatedProcessingTime": "e.g. 2-3 business days"
}`;

export async function analyzeDocument(
  text: string,
  options: { mockMode?: boolean; docTypeHint?: DocType } = {}
): Promise<AIAnalysisResult> {
  const useMockMode =
    options.mockMode ||
    process.env.MOCK_AI === "true" ||
    !process.env.GROQ_API_KEY ||
    !groq;

  if (useMockMode) {
    console.log("Using mock analysis mode");
    return getMockAnalysis(text, options.docTypeHint);
  }

  try {
    console.log("Calling Groq API for document analysis...");
    const response = await groq!.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: AI_USER_PROMPT(text) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("DEBUG: No response content from Groq API");
      throw new Error("No response from Groq API");
    }

    console.log("Groq API response received successfully");
    const parsed = JSON.parse(content) as AIAnalysisResult;
    return validateAndNormalizeResult(parsed);
  } catch (error) {
    console.error("DEBUG: Groq API error occurred:", error);
    console.error("DEBUG: Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      groqConfigured: !!groq,
      hasApiKey: !!process.env.GROQ_API_KEY
    });
    throw error;
  }
}

function validateAndNormalizeResult(result: Partial<AIAnalysisResult>): AIAnalysisResult {
  return {
    docType: result.docType || "other",
    summary: result.summary || "Unable to generate summary.",
    entities: {
      people: result.entities?.people || [],
      organizations: result.entities?.organizations || [],
      dates: result.entities?.dates || [],
      amounts: result.entities?.amounts || [],
      ids: result.entities?.ids || [],
      locations: result.entities?.locations || [],
      emails: result.entities?.emails || [],
      phones: result.entities?.phones || [],
    },
    ownerTeam: result.ownerTeam || "Unknown",
    priority: result.priority || "medium",
    requiredFieldsMissing: result.requiredFieldsMissing || [],
    riskFlags: result.riskFlags || [],
    complianceIssues: result.complianceIssues,
    recommendedActions: result.recommendedActions || [],
    checklist: result.checklist || [],
    draftEmail: result.draftEmail || {
      to: [],
      cc: [],
      subject: "",
      body: "",
      tone: "professional",
    },
    confidence: typeof result.confidence === "number" ? result.confidence : 0.85,
    rationale: result.rationale || "Analysis completed.",
    decisionSignals: result.decisionSignals || [],
    suggestedTags: result.suggestedTags || [],
    estimatedProcessingTime: result.estimatedProcessingTime,
  };
}

// Document type detection helpers
export function detectDocumentType(text: string): DocType {
  const lowerText = text.toLowerCase();

  const patterns: { type: DocType; keywords: string[]; weight: number }[] = [
    { type: "invoice", keywords: ["invoice", "inv-", "bill to", "amount due", "payment terms", "total amount"], weight: 2 },
    { type: "contract", keywords: ["agreement", "hereby agree", "terms and conditions", "parties", "whereas", "obligations"], weight: 2 },
    { type: "resume", keywords: ["experience", "education", "skills", "objective", "career", "employment history"], weight: 2 },
    { type: "incident_report", keywords: ["incident", "occurred", "reported by", "severity", "root cause", "affected"], weight: 2 },
    { type: "meeting_notes", keywords: ["meeting", "attendees", "agenda", "action items", "discussed", "minutes"], weight: 2 },
    { type: "policy", keywords: ["policy", "procedure", "guidelines", "compliance", "effective date", "scope"], weight: 2 },
    { type: "email", keywords: ["subject:", "from:", "to:", "dear", "regards", "sincerely"], weight: 1 },
    { type: "purchase_order", keywords: ["purchase order", "po#", "vendor", "quantity", "unit price", "delivery"], weight: 2 },
    { type: "proposal", keywords: ["proposal", "executive summary", "scope of work", "timeline", "budget", "deliverables"], weight: 2 },
  ];

  let bestMatch: { type: DocType; score: number } = { type: "other", score: 0 };

  for (const pattern of patterns) {
    const score = pattern.keywords.reduce((acc, keyword) => {
      return acc + (lowerText.includes(keyword) ? pattern.weight : 0);
    }, 0);

    if (score > bestMatch.score) {
      bestMatch = { type: pattern.type, score };
    }
  }

  return bestMatch.type;
}

export function detectOwnerTeam(docType: DocType, text: string): OwnerTeam {
  const lowerText = text.toLowerCase();

  // Direct mappings based on document type
  const docTypeToTeam: Partial<Record<DocType, OwnerTeam>> = {
    invoice: "AP",
    contract: "Legal",
    resume: "HR",
    incident_report: "IT",
    policy: "Legal",
    purchase_order: "Procurement",
  };

  if (docTypeToTeam[docType]) {
    return docTypeToTeam[docType]!;
  }

  // Keyword-based detection
  if (lowerText.includes("support") || lowerText.includes("customer") || lowerText.includes("ticket")) {
    return "Support";
  }
  if (lowerText.includes("sales") || lowerText.includes("proposal") || lowerText.includes("deal")) {
    return "Sales";
  }
  if (lowerText.includes("operations") || lowerText.includes("logistics")) {
    return "Ops";
  }
  if (lowerText.includes("finance") || lowerText.includes("budget") || lowerText.includes("expense")) {
    return "Finance";
  }

  return "Unknown";
}

export function detectPriority(text: string): Priority {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("urgent") ||
    lowerText.includes("asap") ||
    lowerText.includes("critical") ||
    lowerText.includes("emergency") ||
    lowerText.includes("immediately")
  ) {
    return "urgent";
  }

  if (
    lowerText.includes("high priority") ||
    lowerText.includes("important") ||
    lowerText.includes("deadline") ||
    lowerText.includes("overdue")
  ) {
    return "high";
  }

  if (lowerText.includes("low priority") || lowerText.includes("when possible") || lowerText.includes("no rush")) {
    return "low";
  }

  return "medium";
}
