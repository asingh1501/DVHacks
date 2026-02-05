import Groq from "groq-sdk";
import { AIAnalysisResult, DocType, OwnerTeam, Priority } from "@/lib/types";
import { getMockAnalysis } from "./mockAI";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const AI_SYSTEM_PROMPT = `You are an expert document analyst for SLATE, Walmart's AI-powered document intelligence platform.
Your job is to deeply read documents and extract EVERY piece of concrete information from them.

CRITICAL RULES:
- Extract ALL names, companies, dates, dollar amounts, IDs, addresses, emails, and phone numbers that appear ANYWHERE in the document. Do not skip any. If a name or number appears in the text, it MUST appear in your entities output.
- Your summary must reference specific facts from the document (names, amounts, dates) — never write a generic summary.
- Risk flags must cite specific issues found IN the document (e.g. "Invoice is past due by 15 days" not "May have timing issues").
- The checklist must contain actionable steps specific to THIS document's content.
- The draft email must reference the actual parties, amounts, and dates from the document.
- If information for a field genuinely does not exist in the document, return an empty array — do NOT fabricate data.
- For requiredFieldsMissing, think about what fields you would EXPECT for this document type that are absent (e.g. an invoice missing a PO number, a contract missing an effective date).
- ALWAYS populate the "leaseFields" object. For EVERY lease field, look hard in the document for it. If a lease field is not present, set it to null. These are the fields TRIRIGA needs for lease administration, so extract them precisely.
- Map document data to lease fields AGGRESSIVELY. Documents may be in any language. Fill as MANY fields as possible — do NOT leave a field null if there is ANY reasonable data to fill it with.
- You MUST also INFER fields when possible. Do NOT only extract literal text — use reasoning:
  - If paymentPeriod is "monthly" and effectiveFrom is known, then endDate = effectiveFrom + 1 month
  - If paymentPeriod is "quarterly" and effectiveFrom is known, then endDate = effectiveFrom + 3 months
  - If effectiveFrom is known and no separate due date exists, oneTimePaymentDue = effectiveFrom (the payment is due on the effective date)
  - If "IVA", "VAT", "GST", "Sales Tax" appear in the Impuestos/Tax column, taxCode = that tax type (e.g. "IVA"), NOT the NIT/tax ID number
  - If a payment is for a single period (one invoice), set paymentType = "one-time"
- Specific mapping rules:
  - "arrendamiento", rental, lease payment, "alquiler" -> paymentType is "rent" (BUT if the invoice covers a single period, ALSO set paymentType to "one-time")
  - The entity/company issuing the document, the lessor, vendor -> landlord
  - The receiving entity, "Receptor", buyer, lessee -> tenant
  - Invoice totals, payment amounts -> BOTH monthlyRent AND oneTimePaymentAmount
  - "Moneda", currency symbols (Q, $, €), GTQ/USD/EUR -> currency
  - Creation dates, "Momento de creación", validation dates, invoice dates -> effectiveFrom
  - Reference numbers, Serie, DTE numbers, approval numbers, "Número de aprobación" -> id or leaseId (use the most unique one for id, use the shorter reference for leaseId)
  - Monthly, quarterly, annual, "del mes de", per-month payments -> paymentPeriod (always use standard English: "monthly", "quarterly", "annual", "one-time")
  - Addresses, locations, property descriptions, "Bulevar", street addresses -> propertyAddress
  - Store names, branch names, department names, "Tienda", location codes -> costCenter`;

const AI_USER_PROMPT = (text: string) => `Read this document carefully and extract every piece of information from it.

DOCUMENT START
${text}
DOCUMENT END

Step 1: Read the entire document above word by word.
Step 2: List every person name, company name, date, dollar amount, ID/reference number, address, email, and phone number you find.
Step 3: Determine what type of document this is based on its structure and content.
Step 4: Write a summary that mentions the specific key facts (who, what, when, how much).
Step 5: Identify what's missing, what's risky, and what needs to happen next — all based on what you actually read.

Respond with a JSON object matching this EXACT schema. Every field must reflect the ACTUAL document content, not generic placeholders:
{
  "docType": "invoice|contract|resume|incident_report|meeting_notes|policy|email|purchase_order|proposal|other",
  "summary": "2-3 sentences with specific names, dates, and amounts from the document",
  "entities": {
    "people": ["every person name found in the document"],
    "organizations": ["every company, department, or org name found"],
    "dates": ["every date or time reference found, in original format"],
    "amounts": ["every dollar amount, fee, total, or price found with currency symbol"],
    "ids": ["every invoice number, PO number, case number, reference ID, account number found"],
    "locations": ["every address, city, state, country found"],
    "emails": ["every email address found"],
    "phones": ["every phone or fax number found"]
  },
  "ownerTeam": "AP|Legal|HR|Ops|Support|Sales|IT|Finance|Procurement|Unknown",
  "priority": "low|medium|high|urgent",
  "requiredFieldsMissing": ["fields expected for this document type that are NOT present in the text"],
  "riskFlags": [{"flag": "short_id", "severity": "info|warning|critical", "description": "specific issue found in THIS document"}],
  "complianceIssues": [{"issue": "specific issue", "regulation": "applicable regulation", "recommendation": "specific action to take"}],
  "recommendedActions": [{"type": "checklist|draft_email|approval_request|escalation|reminder", "title": "specific action title", "priority": "low|medium|high", "stepsOrBody": ["concrete steps referencing document details"], "dueDate": "ISO date if a deadline exists in the document"}],
  "checklist": [{"id": "chk_1", "task": "specific task for this document", "description": "details from the document", "completed": false, "assignee": "team or role if obvious", "dueDate": "date if referenced in document"}],
  "draftEmail": {"to": ["actual recipients from document if identifiable"], "cc": [], "subject": "subject referencing document specifics", "body": "email body referencing actual names, amounts, dates from the document", "tone": "formal|professional|friendly|urgent"},
  "confidence": 0.0-1.0,
  "rationale": "2-3 sentences explaining WHY you classified it this way, citing specific evidence from the text",
  "decisionSignals": ["3-5 bullet statements citing specific phrases or data points from the document that drove your classification"],
  "suggestedTags": ["tags derived from actual document content"],
  "estimatedProcessingTime": "e.g. 2-3 business days",
  "leaseFields": {
    "id": "document ID or reference number, or null if not found",
    "leaseId": "lease ID / lease number / contract number, or null",
    "paymentType": "payment type (e.g. rent, one-time, recurring, deposit), or null",
    "oneTimePaymentAmount": "one-time payment amount with currency, or null",
    "oneTimePaymentDue": "payment due date — if no explicit due date, use the effective/creation date. or null only if no dates exist at all",
    "taxCode": "the TAX TYPE applied (e.g. IVA, VAT, GST, Sales Tax) from the Impuestos/Tax column — NOT the NIT or tax ID number. or null",
    "effectiveFrom": "lease/contract start date, creation date, or invoice date, or null",
    "endDate": "lease end date. If not explicit, INFER from effectiveFrom + paymentPeriod (e.g. monthly = +1 month, quarterly = +3 months). or null only if effectiveFrom is also null",
    "previousMeterReading": "previous meter/utility reading, or null",
    "currentMeterReading": "current meter/utility reading, or null",
    "paymentPeriod": "payment frequency as a standard term: monthly, quarterly, semi-annual, annual, or one-time. Infer from context (e.g. 'del mes de' = monthly). null if unknown",
    "costCenter": "cost center or department code, or null",
    "landlord": "landlord / lessor / property owner name, or null",
    "tenant": "tenant / lessee / renter name, or null",
    "propertyAddress": "full property or premises address, or null",
    "monthlyRent": "recurring rent/lease payment amount with currency symbol (e.g. Q26,389.12 or $5,000.00), or null",
    "securityDeposit": "security deposit amount, or null",
    "leaseTerm": "lease duration (e.g. 12 months, 3 years), or null",
    "currency": "currency code (USD, GTQ, EUR, etc.), or null"
  }
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
      temperature: 0.2,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("DEBUG: No response content from Groq API");
      throw new Error("No response from Groq API");
    }

    console.log("Groq API response received successfully");
    const parsed = JSON.parse(content) as AIAnalysisResult;
    const result = validateAndNormalizeResult(parsed);

    // Log extraction quality so we can verify real data came back
    const entityCount = Object.values(result.entities).flat().length;
    console.log(`[SLATE] Extraction complete — docType: ${result.docType}, entities: ${entityCount}, risks: ${result.riskFlags.length}, confidence: ${result.confidence}`);
    if (entityCount === 0) {
      console.warn("[SLATE] WARNING: Zero entities extracted. The document may have had no extractable data, or the model returned generic output.");
    }

    return result;
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
    leaseFields: result.leaseFields ? inferLeaseFields(result.leaseFields) : undefined,
  };
}

function inferLeaseFields(raw: Partial<AIAnalysisResult["leaseFields"] & object>): NonNullable<AIAnalysisResult["leaseFields"]> {
  const fields = {
    id: raw.id || null,
    leaseId: raw.leaseId || null,
    paymentType: raw.paymentType || null,
    oneTimePaymentAmount: raw.oneTimePaymentAmount || null,
    oneTimePaymentDue: raw.oneTimePaymentDue || null,
    taxCode: raw.taxCode || null,
    effectiveFrom: raw.effectiveFrom || null,
    endDate: raw.endDate || null,
    previousMeterReading: raw.previousMeterReading || null,
    currentMeterReading: raw.currentMeterReading || null,
    paymentPeriod: raw.paymentPeriod || null,
    costCenter: raw.costCenter || null,
    landlord: raw.landlord || null,
    tenant: raw.tenant || null,
    propertyAddress: raw.propertyAddress || null,
    monthlyRent: raw.monthlyRent || null,
    securityDeposit: raw.securityDeposit || null,
    leaseTerm: raw.leaseTerm || null,
    currency: raw.currency || null,
  };

  // Infer oneTimePaymentDue from effectiveFrom if missing
  if (!fields.oneTimePaymentDue && fields.effectiveFrom) {
    fields.oneTimePaymentDue = fields.effectiveFrom;
  }

  // Infer endDate from effectiveFrom + paymentPeriod if missing
  if (!fields.endDate && fields.effectiveFrom && fields.paymentPeriod) {
    const end = inferEndDate(fields.effectiveFrom, fields.paymentPeriod);
    if (end) fields.endDate = end;
  }

  // Infer leaseTerm from paymentPeriod if missing
  if (!fields.leaseTerm && fields.paymentPeriod) {
    const termMap: Record<string, string> = {
      "monthly": "1 month",
      "quarterly": "3 months",
      "semi-annual": "6 months",
      "annual": "12 months",
    };
    fields.leaseTerm = termMap[fields.paymentPeriod.toLowerCase()] || null;
  }

  return fields;
}

function inferEndDate(effectiveFrom: string, paymentPeriod: string): string | null {
  try {
    // Parse common date formats: "06-may-2025", "01-Feb-2025", "2025-05-06", etc.
    const dateStr = effectiveFrom.replace(/\s+\d{2}:\d{2}:\d{2}$/, "").trim(); // strip time
    const parsed = new Date(dateStr);

    // If Date constructor can't parse, try manual parsing for "DD-Mon-YYYY"
    let date: Date;
    if (isNaN(parsed.getTime())) {
      const months: Record<string, number> = {
        jan: 0, ene: 0, feb: 1, mar: 2, apr: 3, abr: 3, may: 4,
        jun: 5, jul: 6, aug: 7, ago: 7, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11,
      };
      const match = dateStr.match(/(\d{1,2})[/-](\w{3,})[/-](\d{4})/i);
      if (!match) return null;
      const day = parseInt(match[1]);
      const mon = months[match[2].toLowerCase().slice(0, 3)];
      const year = parseInt(match[3]);
      if (mon === undefined) return null;
      date = new Date(year, mon, day);
    } else {
      date = parsed;
    }

    if (isNaN(date.getTime())) return null;

    // Add months based on payment period
    const periodMonths: Record<string, number> = {
      "monthly": 1, "quarterly": 3, "semi-annual": 6, "annual": 12, "one-time": 1,
    };
    const monthsToAdd = periodMonths[paymentPeriod.toLowerCase()] || 1;
    date.setMonth(date.getMonth() + monthsToAdd);

    // Format back as DD-Mon-YYYY
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dd = String(date.getDate()).padStart(2, "0");
    const mon = monthNames[date.getMonth()];
    const yyyy = date.getFullYear();
    return `${dd}-${mon}-${yyyy}`;
  } catch {
    return null;
  }
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
