"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CasesTable } from "@/components/case/CasesTable";
import { CaseFilters } from "@/components/case/CaseFilters";
import { StatsOverview } from "@/components/case/StatsOverview";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { CaseWithRelations, CaseStatus, OwnerTeam, Priority } from "@/lib/types";

export default function CasesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState<OwnerTeam | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      const data = await res.json();
      return data.stats;
    },
  });

  // Fetch cases
  const { data: casesData, isLoading: casesLoading, refetch } = useQuery({
    queryKey: ["cases", debouncedSearch, team, priority, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (team !== "all") params.append("team", team);
      if (priority !== "all") params.append("priority", priority);
      if (status !== "all") params.append("status", status);
      params.append("limit", "50");

      const res = await fetch(`/api/cases?${params.toString()}`);
      const data = await res.json();
      return data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete case");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Case deleted successfully");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Failed to delete case");
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) throw new Error("Failed to archive case");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Case archived successfully");
    },
    onError: () => {
      toast.error("Failed to archive case");
    },
  });

  const handleReset = () => {
    setSearch("");
    setTeam("all");
    setPriority("all");
    setStatus("all");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          <p className="text-gray-600">
            Manage and track all document cases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsOverview stats={statsData} isLoading={statsLoading} />

      {/* Filters */}
      <CaseFilters
        search={search}
        onSearchChange={setSearch}
        team={team}
        onTeamChange={setTeam}
        priority={priority}
        onPriorityChange={setPriority}
        status={status}
        onStatusChange={setStatus}
        onReset={handleReset}
      />

      {/* Results count */}
      {casesData && (
        <p className="text-sm text-gray-600">
          Showing {casesData.items.length} of {casesData.total} cases
        </p>
      )}

      {/* Cases Table */}
      <CasesTable
        cases={casesData?.items || []}
        isLoading={casesLoading}
        onDelete={(id) => setDeleteId(id)}
        onArchive={(id) => archiveMutation.mutate(id)}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Pagination (simplified) */}
      {casesData && casesData.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={casesData.page === 1}>
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {casesData.page} of {casesData.totalPages}
          </span>
          <Button variant="outline" disabled={casesData.page === casesData.totalPages}>
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case? This action cannot be undone.
              All associated notes, attachments, and audit history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
