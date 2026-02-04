"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  ArrowLeft,
  Copy,
  Trash2,
  Archive,
  Save,
  Plus,
  Send,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  MapPin,
  Mail,
  Phone,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CaseWithRelations,
  CaseStatus,
  Priority,
  OwnerTeam,
  ChecklistItem,
  Entities,
  RiskFlag,
} from "@/lib/types";
import {
  cn,
  formatRelativeTime,
  formatDate,
  getPriorityColor,
  getStatusColor,
  getTeamColor,
  formatConfidence,
  getStatusDisplayName,
  getDocTypeDisplayName,
} from "@/lib/utils";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch case
  const { data, isLoading, error } = useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Case not found");
        throw new Error("Failed to fetch case");
      }
      const data = await res.json();
      return data.case as CaseWithRelations;
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<CaseWithRelations>) => {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update case");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      toast.success("Case updated");
    },
    onError: () => {
      toast.error("Failed to update case");
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cases/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote, noteType }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", id] });
      setNewNote("");
      toast.success("Note added");
    },
    onError: () => {
      toast.error("Failed to add note");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete case");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Case deleted");
      router.push("/cases");
    },
    onError: () => {
      toast.error("Failed to delete case");
    },
  });

  const handleChecklistToggle = (itemId: string) => {
    if (!data) return;
    const updatedChecklist = data.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateMutation.mutate({ checklist: updatedChecklist as any });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return <CaseDetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Case Not Found</h1>
        <p className="text-gray-600 mb-4">
          The case you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Link href="/cases">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  const completedTasks = data.checklist.filter((item) => item.completed).length;
  const checklistProgress =
    data.checklist.length > 0
      ? (completedTasks / data.checklist.length) * 100
      : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/cases">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Case Details</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {data.id.slice(0, 8)}
                <button
                  onClick={() => copyToClipboard(data.id)}
                  className="ml-1 hover:text-[#0071DC]"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </Badge>
            </div>
            <p className="text-gray-600">{data.fileName || "Pasted content"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => updateMutation.mutate({ status: "archived" })}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Document Type</p>
            <Badge variant="outline">{getDocTypeDisplayName(data.docType)}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Team</p>
            <Select
              value={data.ownerTeam}
              onValueChange={(v) => updateMutation.mutate({ ownerTeam: v as OwnerTeam })}
            >
              <SelectTrigger className="h-7 w-24">
                <Badge className={cn("text-white", getTeamColor(data.ownerTeam))}>
                  {data.ownerTeam}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {["AP", "Legal", "HR", "Ops", "Support", "Sales", "IT", "Finance", "Procurement"].map(
                  (team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <Select
              value={data.priority}
              onValueChange={(v) => updateMutation.mutate({ priority: v as Priority })}
            >
              <SelectTrigger className="h-7 w-24">
                <Badge className={getPriorityColor(data.priority)}>
                  {data.priority}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {["low", "medium", "high", "urgent"].map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <Select
              value={data.status}
              onValueChange={(v) => updateMutation.mutate({ status: v as CaseStatus })}
            >
              <SelectTrigger className="h-7 w-32">
                <Badge className={getStatusColor(data.status)}>
                  {getStatusDisplayName(data.status)}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {["new", "in_progress", "pending_review", "resolved", "archived"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {getStatusDisplayName(s as CaseStatus)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <Progress value={data.confidence * 100} className="h-2 flex-1" />
              <span className="text-sm font-medium">{formatConfidence(data.confidence)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{data.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 italic">{data.aiRationale}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatDate(data.createdAt, "PPP 'at' p")}</p>
                <p className="text-xs text-gray-500">{formatRelativeTime(data.createdAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatDate(data.updatedAt, "PPP 'at' p")}</p>
                <p className="text-xs text-gray-500">{formatRelativeTime(data.updatedAt)}</p>
              </CardContent>
            </Card>
          </div>

          {data.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityDisplay entities={data.entities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          {/* Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Checklist</CardTitle>
                <span className="text-sm text-gray-500">
                  {completedTasks} / {data.checklist.length} completed
                </span>
              </div>
              <Progress value={checklistProgress} className="h-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      item.completed && "bg-green-50 border-green-200"
                    )}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleChecklistToggle(item.id)}
                    />
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          item.completed && "line-through text-gray-500"
                        )}
                      >
                        {item.task}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-500">{item.description}</p>
                      )}
                    </div>
                    {item.completed && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Draft Email */}
          <Card>
            <CardHeader>
              <CardTitle>Draft Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-16">To:</span>
                  <span>{data.draftEmail.to.join(", ") || "—"}</span>
                </div>
                {data.draftEmail.cc.length > 0 && (
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-500 w-16">Cc:</span>
                    <span>{data.draftEmail.cc.join(", ")}</span>
                  </div>
                )}
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-16">Subject:</span>
                  <span className="font-medium">{data.draftEmail.subject || "—"}</span>
                </div>
                <Separator />
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {data.draftEmail.body || "No draft email generated."}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(data.draftEmail.body)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          {/* Risk Flags */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {data.riskFlags.length > 0 ? (
                <div className="space-y-3">
                  {data.riskFlags.map((flag, idx) => (
                    <RiskFlagCard key={idx} flag={flag} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 py-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>No risk flags detected</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Missing Information</CardTitle>
            </CardHeader>
            <CardContent>
              {data.missingFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.missingFields.map((field, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-orange-300 text-orange-700 bg-orange-50"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 py-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>No missing information detected</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Issues */}
          {data.complianceIssues && data.complianceIssues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.complianceIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-red-200 bg-red-50"
                    >
                      <p className="font-medium text-red-800">{issue.issue}</p>
                      <p className="text-sm text-red-600">
                        Regulation: {issue.regulation}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {issue.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              {data.auditEvents && data.auditEvents.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {data.auditEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex gap-4 pb-4 border-b last:border-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {event.actor === "system" ? (
                            <Clock className="w-5 h-5 text-gray-500" />
                          ) : event.actor === "ai" ? (
                            <FileText className="w-5 h-5 text-[#0071DC]" />
                          ) : (
                            <User className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{event.actor}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.eventType.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{event.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(event.createdAt, "PPP 'at' p")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-gray-500 text-center py-4">No audit events yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="decision">Decision</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="escalation">Escalation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Write a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {data.notes && data.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Notes ({data.notes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border bg-gray-50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{note.author}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {note.noteType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatRelativeTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EntityDisplay({ entities }: { entities: Entities }) {
  const entityIcons: Record<keyof Entities, React.ReactNode> = {
    people: <User className="w-4 h-4" />,
    organizations: <Building2 className="w-4 h-4" />,
    dates: <Calendar className="w-4 h-4" />,
    amounts: <DollarSign className="w-4 h-4" />,
    ids: <Hash className="w-4 h-4" />,
    locations: <MapPin className="w-4 h-4" />,
    emails: <Mail className="w-4 h-4" />,
    phones: <Phone className="w-4 h-4" />,
  };

  const entityLabels: Record<keyof Entities, string> = {
    people: "People",
    organizations: "Organizations",
    dates: "Dates",
    amounts: "Amounts",
    ids: "IDs",
    locations: "Locations",
    emails: "Emails",
    phones: "Phones",
  };

  const hasEntities = Object.values(entities).some((arr) => arr.length > 0);

  if (!hasEntities) {
    return <p className="text-gray-500">No entities extracted</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {(Object.entries(entities) as [keyof Entities, string[]][]).map(
        ([type, values]) =>
          values.length > 0 && (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2 text-gray-700">
                {entityIcons[type]}
                <span className="font-medium">{entityLabels[type]}</span>
                <Badge variant="secondary" className="text-xs">
                  {values.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {values.map((value, idx) => (
                  <Badge key={idx} variant="outline">
                    {value}
                  </Badge>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}

function RiskFlagCard({ flag }: { flag: RiskFlag }) {
  const severityConfig = {
    critical: {
      icon: <AlertTriangle className="w-5 h-5" />,
      className: "border-red-200 bg-red-50 text-red-800",
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5" />,
      className: "border-[#FFC220]/30 bg-[#FFC220]/10 text-[#996600]",
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      className: "border-[#0071DC]/20 bg-[#0071DC]/10 text-[#0071DC]",
    },
  };

  const config = severityConfig[flag.severity];

  return (
    <div className={cn("flex items-start gap-3 p-4 rounded-lg border", config.className)}>
      {config.icon}
      <div>
        <p className="font-medium">{flag.flag}</p>
        <p className="text-sm opacity-80">{flag.description}</p>
      </div>
    </div>
  );
}

function CaseDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
