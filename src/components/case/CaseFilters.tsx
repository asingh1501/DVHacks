"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, RotateCcw } from "lucide-react";
import { CaseStatus, OwnerTeam, Priority } from "@/lib/types";

interface CaseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  team: OwnerTeam | "all";
  onTeamChange: (value: OwnerTeam | "all") => void;
  priority: Priority | "all";
  onPriorityChange: (value: Priority | "all") => void;
  status: CaseStatus | "all";
  onStatusChange: (value: CaseStatus | "all") => void;
  onReset: () => void;
}

const teams: OwnerTeam[] = [
  "AP",
  "Legal",
  "HR",
  "Ops",
  "Support",
  "Sales",
  "IT",
  "Finance",
  "Procurement",
  "Unknown",
];

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

const statuses: CaseStatus[] = [
  "new",
  "in_progress",
  "pending_review",
  "resolved",
  "archived",
];

const statusLabels: Record<CaseStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  pending_review: "Pending Review",
  resolved: "Resolved",
  archived: "Archived",
};

export function CaseFilters({
  search,
  onSearchChange,
  team,
  onTeamChange,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  onReset,
}: CaseFiltersProps) {
  const hasFilters =
    search || team !== "all" || priority !== "all" || status !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search cases..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Team Filter */}
      <Select value={team} onValueChange={(v) => onTeamChange(v as OwnerTeam | "all")}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={priority}
        onValueChange={(v) => onPriorityChange(v as Priority | "all")}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {priorities.map((p) => (
            <SelectItem key={p} value={p} className="capitalize">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={status} onValueChange={(v) => onStatusChange(v as CaseStatus | "all")}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {statusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset Button */}
      {hasFilters && (
        <Button variant="outline" size="icon" onClick={onReset} title="Reset filters">
          <RotateCcw className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
