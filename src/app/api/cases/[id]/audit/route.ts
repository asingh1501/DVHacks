import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { safeJsonParse } from "@/lib/utils";

// POST /api/cases/[id]/audit - Create an audit event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { eventType, description, metadata, changes, actor = "user" } = body;

    if (!eventType || !description) {
      return NextResponse.json(
        { error: "Event type and description are required" },
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

    // Create the audit event
    const event = await prisma.auditEvent.create({
      data: {
        caseId: id,
        eventType,
        actor,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        changes: changes ? JSON.stringify(changes) : null,
      },
    });

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        metadata: safeJsonParse(event.metadata || "null", null),
        changes: safeJsonParse(event.changes || "null", null),
      },
    });
  } catch (error) {
    console.error("Error creating audit event:", error);
    return NextResponse.json(
      { error: "Failed to create audit event" },
      { status: 500 }
    );
  }
}

// GET /api/cases/[id]/audit - Get all audit events for a case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const events = await prisma.auditEvent.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "desc" },
    });

    const parsedEvents = events.map((e) => ({
      ...e,
      metadata: safeJsonParse(e.metadata || "null", null),
      changes: safeJsonParse(e.changes || "null", null),
    }));

    return NextResponse.json({
      success: true,
      events: parsedEvents,
    });
  } catch (error) {
    console.error("Error fetching audit events:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit events" },
      { status: 500 }
    );
  }
}
