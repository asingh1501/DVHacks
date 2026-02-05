import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { safeJsonParse } from "@/lib/utils";
import { CaseWithRelations } from "@/lib/types";

// GET /api/cases/[id] - Get a single case with all relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseData = await prisma.case.findUnique({
      where: { id },
      include: {
        auditEvents: {
          orderBy: { createdAt: "desc" },
        },
        notes: {
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    type AuditEventType = NonNullable<CaseWithRelations["auditEvents"]>[number]["eventType"];
    type NoteType = NonNullable<CaseWithRelations["notes"]>[number]["noteType"];
    const parsedCase: CaseWithRelations = {
      ...caseData,
      entities: safeJsonParse(caseData.entities, { people: [], organizations: [], dates: [], amounts: [], ids: [], locations: [], emails: [], phones: [] }),
      missingFields: safeJsonParse(caseData.missingFields, []),
      riskFlags: safeJsonParse(caseData.riskFlags, []),
      complianceIssues: safeJsonParse(caseData.complianceIssues || "null", null),
      checklist: safeJsonParse(caseData.checklist, []),
      draftEmail: safeJsonParse(caseData.draftEmail, { to: [], cc: [], subject: "", body: "", tone: "professional" }),
      suggestedActions: safeJsonParse(caseData.suggestedActions, []),
      userEdits: safeJsonParse(caseData.userEdits || "null", null),
      editedFields: safeJsonParse(caseData.editedFields || "null", null),
      tags: safeJsonParse(caseData.tags, []),
      leaseFields: safeJsonParse((caseData as any).leaseFields || "null", null),
      docType: caseData.docType as CaseWithRelations["docType"],
      ownerTeam: caseData.ownerTeam as CaseWithRelations["ownerTeam"],
      priority: caseData.priority as CaseWithRelations["priority"],
      status: caseData.status as CaseWithRelations["status"],
      auditEvents: caseData.auditEvents.map((e: any) => ({
        ...e,
        eventType: e.eventType as AuditEventType,
        metadata: safeJsonParse(e.metadata || "null", null),
        changes: safeJsonParse(e.changes || "null", null),
      })),
      notes: caseData.notes.map((n: any) => ({
        ...n,
        noteType: n.noteType as NoteType,
      })),
      attachments: caseData.attachments,
    };

    return NextResponse.json({
      success: true,
      case: parsedCase,
    });
  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 }
    );
  }
}

// PATCH /api/cases/[id] - Update a case
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { changes, changeReason, ...updates } = body;

    // Get the current case for comparison
    const currentCase = await prisma.case.findUnique({
      where: { id },
    });

    if (!currentCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    // Handle JSON fields
    const jsonFields = ["entities", "missingFields", "riskFlags", "complianceIssues", "checklist", "draftEmail", "suggestedActions", "userEdits", "editedFields", "tags", "leaseFields"];

    for (const [key, value] of Object.entries(updates)) {
      if (jsonFields.includes(key)) {
        updateData[key] = typeof value === "string" ? value : JSON.stringify(value);
      } else {
        updateData[key] = value;
      }
    }

    // Update the case
    const updatedCase = await prisma.case.update({
      where: { id },
      data: updateData,
    });

    // Create audit event for the update
    await prisma.auditEvent.create({
      data: {
        caseId: id,
        eventType: "edited",
        actor: "user",
        description: changeReason || "Case updated",
        metadata: JSON.stringify({ updatedFields: Object.keys(updates) }),
        changes: changes ? JSON.stringify(changes) : null,
      },
    });

    // Parse JSON fields for response
    const parsedCase = {
      ...updatedCase,
      entities: safeJsonParse(updatedCase.entities, {}),
      missingFields: safeJsonParse(updatedCase.missingFields, []),
      riskFlags: safeJsonParse(updatedCase.riskFlags, []),
      complianceIssues: safeJsonParse(updatedCase.complianceIssues || "null", null),
      checklist: safeJsonParse(updatedCase.checklist, []),
      draftEmail: safeJsonParse(updatedCase.draftEmail, {}),
      suggestedActions: safeJsonParse(updatedCase.suggestedActions, []),
      tags: safeJsonParse(updatedCase.tags, []),
    };

    return NextResponse.json({
      success: true,
      case: parsedCase,
    });
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id] - Delete a case
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if case exists
    const caseData = await prisma.case.findUnique({
      where: { id },
    });

    if (!caseData) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Delete the case (cascades to related records)
    await prisma.case.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Case deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 }
    );
  }
}
