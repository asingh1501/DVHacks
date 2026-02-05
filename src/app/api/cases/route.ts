import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { generateDocumentHash, safeJsonParse } from "@/lib/utils";
import { AIAnalysisResult, CaseStatus, OwnerTeam, Priority, CaseWithRelations } from "@/lib/types";

// GET /api/cases - List all cases with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const team = searchParams.get("team") as OwnerTeam | null;
    const priority = searchParams.get("priority") as Priority | null;
    const status = searchParams.get("status") as CaseStatus | null;
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (team) {
      where.ownerTeam = team;
    }

    if (priority) {
      where.priority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { summary: { contains: search } },
        { originalText: { contains: search } },
        { fileName: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.case.count({ where });

    // Get cases
    const cases = await prisma.case.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    // Parse JSON fields
    const parsedCases: CaseWithRelations[] = cases.map((c) => ({
      ...c,
      entities: safeJsonParse(c.entities, { people: [], organizations: [], dates: [], amounts: [], ids: [], locations: [], emails: [], phones: [] }),
      missingFields: safeJsonParse(c.missingFields, []),
      riskFlags: safeJsonParse(c.riskFlags, []),
      complianceIssues: safeJsonParse(c.complianceIssues || "null", null),
      checklist: safeJsonParse(c.checklist, []),
      draftEmail: safeJsonParse(c.draftEmail, { to: [], cc: [], subject: "", body: "", tone: "professional" }),
      suggestedActions: safeJsonParse(c.suggestedActions, []),
      userEdits: safeJsonParse(c.userEdits || "null", null),
      editedFields: safeJsonParse(c.editedFields || "null", null),
      tags: safeJsonParse(c.tags, []),
      leaseFields: safeJsonParse((c as any).leaseFields || "null", null),
      docType: c.docType as CaseWithRelations["docType"],
      ownerTeam: c.ownerTeam as CaseWithRelations["ownerTeam"],
      priority: c.priority as CaseWithRelations["priority"],
      status: c.status as CaseWithRelations["status"],
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: parsedCases,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fileName,
      fileType,
      originalText,
      analysisResult,
      userEdits,
      classificationConfirmation,
    } = body as {
      fileName?: string;
      fileType?: string;
      originalText: string;
      analysisResult: AIAnalysisResult;
      userEdits?: Partial<AIAnalysisResult>;
      classificationConfirmation?: {
        ownerTeam: string;
        priority: string;
        reason?: string;
        hasOverride?: boolean;
        confirmedAt?: string;
      };
    };

    if (!originalText || !analysisResult) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate document hash
    const documentHash = generateDocumentHash(originalText);

    // Check for duplicates
    const existing = await prisma.case.findFirst({
      where: { documentHash },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A case with this document already exists", existingCaseId: existing.id },
        { status: 409 }
      );
    }

    // Merge user edits with AI analysis
    const mergedResult = userEdits ? { ...analysisResult, ...userEdits } : analysisResult;

    const editedFields =
      classificationConfirmation && classificationConfirmation.confirmedAt
        ? {
            classification: {
              ownerTeam: mergedResult.ownerTeam,
              priority: mergedResult.priority,
              reason: classificationConfirmation.reason || "",
              confirmedAt: classificationConfirmation.confirmedAt,
              hasOverride: !!classificationConfirmation.hasOverride,
            },
          }
        : null;

    // Create case
    const newCase = await prisma.case.create({
      data: {
        fileName,
        fileType,
        originalText,
        documentHash,
        docType: mergedResult.docType,
        summary: mergedResult.summary,
        entities: JSON.stringify(mergedResult.entities),
        ownerTeam: mergedResult.ownerTeam,
        priority: mergedResult.priority,
        confidence: mergedResult.confidence,
        aiRationale: mergedResult.rationale,
        missingFields: JSON.stringify(mergedResult.requiredFieldsMissing),
        riskFlags: JSON.stringify(mergedResult.riskFlags),
        complianceIssues: mergedResult.complianceIssues
          ? JSON.stringify(mergedResult.complianceIssues)
          : null,
        checklist: JSON.stringify(mergedResult.checklist),
        draftEmail: JSON.stringify(mergedResult.draftEmail),
        suggestedActions: JSON.stringify(mergedResult.recommendedActions),
        leaseFields: mergedResult.leaseFields ? JSON.stringify(mergedResult.leaseFields) : null,
        userEdits: userEdits ? JSON.stringify(userEdits) : null,
        editedFields: editedFields ? JSON.stringify(editedFields) : null,
        tags: JSON.stringify(mergedResult.suggestedTags),
        status: "new",
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        caseId: newCase.id,
        eventType: "created",
        actor: "user",
        description: "Case created from document analysis",
        metadata: JSON.stringify({
          fileName,
          fileType,
          confidence: mergedResult.confidence,
        }),
      },
    });

    if (classificationConfirmation && classificationConfirmation.confirmedAt) {
      await prisma.auditEvent.create({
        data: {
          caseId: newCase.id,
          eventType: "edited",
          actor: "user",
          description: classificationConfirmation.hasOverride
            ? "Classification overridden"
            : "Classification confirmed",
          metadata: JSON.stringify({
            reason: classificationConfirmation.reason || "",
            confirmedAt: classificationConfirmation.confirmedAt,
          }),
          changes: JSON.stringify({
            before: {
              ownerTeam: analysisResult.ownerTeam,
              priority: analysisResult.priority,
            },
            after: {
              ownerTeam: mergedResult.ownerTeam,
              priority: mergedResult.priority,
            },
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      case: {
        ...newCase,
        entities: mergedResult.entities,
        missingFields: mergedResult.requiredFieldsMissing,
        riskFlags: mergedResult.riskFlags,
        complianceIssues: mergedResult.complianceIssues,
        checklist: mergedResult.checklist,
        draftEmail: mergedResult.draftEmail,
        suggestedActions: mergedResult.recommendedActions,
        tags: mergedResult.suggestedTags,
      },
    });
  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}
