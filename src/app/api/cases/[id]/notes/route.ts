import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// POST /api/cases/[id]/notes - Add a note to a case
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, noteType = "general", author = "User" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Check if case exists
    const caseExists = await prisma.case.findUnique({
      where: { id },
    });

    if (!caseExists) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Create the note
    const note = await prisma.caseNote.create({
      data: {
        caseId: id,
        content,
        noteType,
        author,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        caseId: id,
        eventType: "note_added",
        actor: "user",
        description: `Note added: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
        metadata: JSON.stringify({ noteId: note.id, noteType }),
      },
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// GET /api/cases/[id]/notes - Get all notes for a case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notes = await prisma.caseNote.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
