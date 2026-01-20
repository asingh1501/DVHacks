"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  byStatus: {
    new: number;
    in_progress: number;
    pending_review: number;
    resolved: number;
    archived: number;
  };
  byTeam: Record<string, number>;
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}

interface StatsOverviewProps {
  stats?: Stats;
  isLoading?: boolean;
}

export function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Cases",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Today",
      value: stats.today,
      icon: Calendar,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "This Week",
      value: stats.thisWeek,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Pending Review",
      value: stats.byStatus.pending_review,
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusBar label="New" value={stats.byStatus.new} total={stats.total} color="bg-purple-500" />
              <StatusBar label="In Progress" value={stats.byStatus.in_progress} total={stats.total} color="bg-blue-500" />
              <StatusBar label="Pending Review" value={stats.byStatus.pending_review} total={stats.total} color="bg-yellow-500" />
              <StatusBar label="Resolved" value={stats.byStatus.resolved} total={stats.total} color="bg-green-500" />
              <StatusBar label="Archived" value={stats.byStatus.archived} total={stats.total} color="bg-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* By Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusBar label="Urgent" value={stats.byPriority.urgent} total={stats.total} color="bg-red-500" />
              <StatusBar label="High" value={stats.byPriority.high} total={stats.total} color="bg-orange-500" />
              <StatusBar label="Medium" value={stats.byPriority.medium} total={stats.total} color="bg-blue-500" />
              <StatusBar label="Low" value={stats.byPriority.low} total={stats.total} color="bg-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8 text-right">{value}</span>
    </div>
  );
}
