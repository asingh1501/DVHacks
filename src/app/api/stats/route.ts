import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// GET /api/stats - Get dashboard statistics
export async function GET() {
  try {
    // Get total cases
    const totalCases = await prisma.case.count();

    // Get cases by status
    const casesByStatus = await prisma.case.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    // Get cases by team
    const casesByTeam = await prisma.case.groupBy({
      by: ["ownerTeam"],
      _count: {
        _all: true,
      },
    });

    // Get cases by priority
    const casesByPriority = await prisma.case.groupBy({
      by: ["priority"],
      _count: {
        _all: true,
      },
    });

    // Get cases by doc type
    const casesByDocType = await prisma.case.groupBy({
      by: ["docType"],
      _count: {
        _all: true,
      },
    });

    // Get recent cases (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCases = await prisma.case.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get today's cases
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCases = await prisma.case.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Format the response
    const statusMap = Object.fromEntries(
      casesByStatus.map((s) => [s.status, s._count._all])
    );

    const teamMap = Object.fromEntries(
      casesByTeam.map((t) => [t.ownerTeam, t._count._all])
    );

    const priorityMap = Object.fromEntries(
      casesByPriority.map((p) => [p.priority, p._count._all])
    );

    const docTypeMap = Object.fromEntries(
      casesByDocType.map((d) => [d.docType, d._count._all])
    );

    return NextResponse.json({
      success: true,
      stats: {
        total: totalCases,
        today: todayCases,
        thisWeek: recentCases,
        byStatus: {
          new: statusMap.new || 0,
          in_progress: statusMap.in_progress || 0,
          pending_review: statusMap.pending_review || 0,
          resolved: statusMap.resolved || 0,
          archived: statusMap.archived || 0,
        },
        byTeam: teamMap,
        byPriority: {
          low: priorityMap.low || 0,
          medium: priorityMap.medium || 0,
          high: priorityMap.high || 0,
          urgent: priorityMap.urgent || 0,
        },
        byDocType: docTypeMap,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
