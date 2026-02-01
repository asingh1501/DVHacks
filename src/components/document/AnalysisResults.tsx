"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Hash,
  MapPin,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
} from "lucide-react";
import {
  AIAnalysisResult,
  RiskFlag,
  ChecklistItem,
  Entities,
  OwnerTeam,
  Priority,
} from "@/lib/types";
import {
  cn,
  getPriorityColor,
  getTeamColor,
  formatConfidence,
  getDocTypeDisplayName,
} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AnalysisResultsProps {
  analysis: AIAnalysisResult;
  onEdit?: (updates: Partial<AIAnalysisResult>) => void;
  onCreateCase?: (mode?: "detail" | "queue") => Promise<void> | void;
  isCreating?: boolean;
  onConfirmClassification?: (payload: {
    ownerTeam: OwnerTeam;
    priority: Priority;
    reason: string;
    hasOverride: boolean;
    confirmedAt: string;
  }) => void;
}

export function AnalysisResults({
  analysis,
  onEdit,
  onCreateCase,
  isCreating,
  onConfirmClassification,
}: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["classification", "summary", "entities", "risks"])
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [selectedTeam, setSelectedTeam] = useState<OwnerTeam>(analysis.ownerTeam);
  const [selectedPriority, setSelectedPriority] = useState<Priority>(analysis.priority);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActioned, setIsActioned] = useState(false);

  useEffect(() => {
    setSelectedTeam(analysis.ownerTeam);
    setSelectedPriority(analysis.priority);
    setIsConfirmed(false);
    setOverrideReason("");
    setIsActioned(false);
  }, [analysis.ownerTeam, analysis.priority]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const startEdit = (field: string, value: unknown) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: value });
  };

  const saveEdit = (field: string) => {
    if (onEdit && editValues[field] !== undefined) {
      onEdit({ [field]: editValues[field] } as Partial<AIAnalysisResult>);
    }
    setEditingField(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const getSeverityIcon = (severity: RiskFlag["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: RiskFlag["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getEntityIcon = (type: keyof Entities) => {
    const icons: Record<keyof Entities, React.ReactNode> = {
      people: <Users className="w-4 h-4" />,
      organizations: <Building2 className="w-4 h-4" />,
      dates: <Calendar className="w-4 h-4" />,
      amounts: <DollarSign className="w-4 h-4" />,
      ids: <Hash className="w-4 h-4" />,
      locations: <MapPin className="w-4 h-4" />,
      emails: <Mail className="w-4 h-4" />,
      phones: <Phone className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getFallbackDecisionSignals = (analysisResult: AIAnalysisResult) => {
    const signals: string[] = [];
    const hasEntities = Object.values(analysisResult.entities || {}).some(
      (values) => Array.isArray(values) && values.length > 0
    );

    if (analysisResult.docType) {
      signals.push(
        `Document type inferred as ${getDocTypeDisplayName(analysisResult.docType)} from structure and keywords.`
      );
    }
    if (analysisResult.ownerTeam === "Unknown") {
      signals.push("No explicit department keywords found for routing.");
    } else {
      signals.push(`Routing aligned to ${analysisResult.ownerTeam} based on detected domain cues.`);
    }
    if (analysisResult.priority === "urgent") {
      signals.push("Urgency inferred from time-sensitive or critical language.");
    } else if (analysisResult.priority === "high") {
      signals.push("Deadline or priority wording indicates elevated urgency.");
    } else {
      signals.push("No strong urgency cues; defaulted to medium priority.");
    }

    if (signals.length < 3) {
      if (analysisResult.confidence < 0.7) {
        signals.push("Confidence reduced due to mixed or sparse signals.");
      } else {
        signals.push("Confidence supported by consistent cues across sections.");
      }
    }

    if (signals.length < 3) {
      signals.push("Classification based on overall structure and recurring terms.");
    }

    if (signals.length < 3 && !hasEntities) {
      signals.push("Few explicit entities extracted, so routing stayed conservative.");
    }

    return signals.slice(0, 4);
  };

  const fallbackDecisionSignals = getFallbackDecisionSignals(analysis);
  const baseDecisionSignals =
    analysis.decisionSignals && analysis.decisionSignals.length > 0
      ? analysis.decisionSignals
      : [];
  const decisionSignals =
    baseDecisionSignals.length >= 3
      ? baseDecisionSignals
      : [
          ...baseDecisionSignals,
          ...fallbackDecisionSignals.filter((signal) => !baseDecisionSignals.includes(signal)),
        ];

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

  const hasOverride =
    selectedTeam !== analysis.ownerTeam || selectedPriority !== analysis.priority;
  const displayTeam = isConfirmed ? selectedTeam : analysis.ownerTeam;
  const displayPriority = isConfirmed ? selectedPriority : analysis.priority;
  const isReasonRequired = hasOverride && overrideReason.trim().length === 0;
  const workflowQueueLabel =
    displayTeam === "Unknown" ? "Procurement Queue" : `${displayTeam} Queue`;
  const formatNextAction = () => {
    if (analysis.requiredFieldsMissing.length > 0) {
      const preview = analysis.requiredFieldsMissing.slice(0, 2).join(", ");
      return analysis.requiredFieldsMissing.length > 2
        ? `Review missing info: ${preview} +${analysis.requiredFieldsMissing.length - 2} more`
        : `Review missing info: ${preview}`;
    }
    if (analysis.riskFlags.length > 0) {
      return "Review flagged risks before routing";
    }
    return "Route to queue and schedule initial review";
  };

  const getSlaHours = () => {
    switch (displayPriority) {
      case "urgent":
        return 4;
      case "high":
        return 12;
      case "medium":
        return 24;
      case "low":
        return 48;
    }
  };

  const riskScore = Math.min(
    100,
    analysis.riskFlags.reduce((acc, flag) => {
      if (flag.severity === "critical") return acc + 30;
      if (flag.severity === "warning") return acc + 15;
      return acc + 5;
    }, 0)
  );
  const riskLevel =
    riskScore >= 60 ? "High" : riskScore >= 30 ? "Moderate" : "Low";

  const lifecycleSteps = [
    { label: "Uploaded", state: "complete" },
    { label: "Analyzed", state: "complete" },
    { label: "Routed", state: isConfirmed ? "complete" : "pending" },
    { label: "Actioned", state: isActioned ? "complete" : "pending" },
  ] as const;

  const handleCreateWorkflow = async (mode: "detail" | "queue") => {
    await onCreateCase?.(mode);
    if (mode === "detail") {
      setIsActioned(true);
    }
  };

  const confirmClassification = () => {
    setIsConfirmed(true);
    if (onEdit && (hasOverride || !isConfirmed)) {
      onEdit({ ownerTeam: selectedTeam, priority: selectedPriority });
    }
    if (onConfirmClassification) {
      onConfirmClassification({
        ownerTeam: selectedTeam,
        priority: selectedPriority,
        reason: overrideReason.trim(),
        hasOverride,
        confirmedAt: new Date().toISOString(),
      });
    }
  };

  const formatPriorityLabel = (value: Priority) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const SectionHeader = ({
    title,
    section,
    badge,
  }: {
    title: string;
    section: string;
    badge?: React.ReactNode;
  }) => (
    <button
      className="flex items-center justify-between w-full py-2 text-left"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">{title}</span>
        {badge}
      </div>
      {expandedSections.has(section) ? (
        <ChevronUp className="w-4 h-4 text-gray-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-500" />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Classification Card */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader title="Classification" section="classification" />
        </CardHeader>
        {expandedSections.has("classification") && (
          <CardContent className="pt-0">
            <div className="mb-4 rounded-lg border bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Document Lifecycle</p>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  Pipeline
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {lifecycleSteps.map((step) => (
                  <div key={step.label} className="flex flex-col items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-full rounded-full",
                        step.state === "complete" ? "bg-emerald-500" : "bg-gray-200"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wide",
                        step.state === "complete" ? "text-emerald-700" : "text-gray-500"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Document Type</p>
                  <Badge variant="outline" className="text-sm">
                    {getDocTypeDisplayName(analysis.docType)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned Team</p>
                  <div className="flex flex-col items-start gap-1">
                    <Badge className={cn("text-white", getTeamColor(displayTeam))}>
                      {displayTeam}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wide w-fit",
                        isConfirmed
                          ? "border-emerald-200 text-emerald-700"
                          : "border-gray-200 text-gray-600"
                      )}
                    >
                      {isConfirmed ? "Human Confirmed" : "AI Suggested"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <div className="flex flex-col items-start gap-1">
                    <Badge className={getPriorityColor(displayPriority)}>
                      {formatPriorityLabel(displayPriority)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wide w-fit",
                        isConfirmed
                          ? "border-emerald-200 text-emerald-700"
                          : "border-gray-200 text-gray-600"
                      )}
                    >
                      {isConfirmed ? "Human Confirmed" : "AI Suggested"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 mb-1">Confidence</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase tracking-wide border-blue-200 text-blue-700 transition-all duration-500",
                        isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      )}
                    >
                      {formatConfidence(analysis.confidence)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={analysis.confidence * 100} className="h-2 flex-1" />
                    <span className="text-sm font-medium">
                      {formatConfidence(analysis.confidence)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white px-4 py-3">
                <p className="text-xs text-gray-500 mb-3">Risk Meter</p>
                <div className="flex items-end justify-center gap-3">
                  <div className="relative h-32 w-3 rounded-full bg-gray-200">
                    <div
                      className={cn(
                        "absolute bottom-0 w-full rounded-full transition-all duration-500",
                        riskScore >= 60
                          ? "bg-red-500"
                          : riskScore >= 30
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ height: `${Math.max(riskScore, 6)}%` }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{riskLevel} Risk</p>
                    <p className="text-xs text-gray-500">{riskScore}% signal density</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 italic">{analysis.rationale}</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Confirm / Adjust</p>
                  <p className="text-xs text-gray-500">
                    Review the AI suggestion and confirm or override before finalizing.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  Human-in-the-loop
                </Badge>
                <Button
                  size="sm"
                  className={cn(
                    "gap-2 shadow-sm",
                    isConfirmed ? "bg-emerald-600 hover:bg-emerald-700" : undefined
                  )}
                  disabled={(isConfirmed && !hasOverride) || isReasonRequired}
                  onClick={confirmClassification}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isConfirmed ? "Confirmed" : "Confirm Classification"}
                </Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Assigned Team</p>
                  <Select
                    value={selectedTeam}
                    onValueChange={(v) => {
                      setSelectedTeam(v as OwnerTeam);
                      setIsConfirmed(false);
                    }}
                  >
                    <SelectTrigger className="h-10 bg-white">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Priority</p>
                  <Select
                    value={selectedPriority}
                    onValueChange={(v) => {
                      setSelectedPriority(v as Priority);
                      setIsConfirmed(false);
                    }}
                  >
                    <SelectTrigger className="h-10 bg-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority} className="capitalize">
                          {formatPriorityLabel(priority)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Reason for override</p>
                  {hasOverride && (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700">
                      Required
                    </span>
                  )}
                </div>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => {
                    setOverrideReason(e.target.value);
                    setIsConfirmed(false);
                  }}
                  placeholder="Explain why you changed the AI suggestion..."
                  className="mt-1 min-h-[84px] bg-white text-sm"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  This note appears in the audit trail for accountability.
                </p>
              </div>
              {hasOverride && !isConfirmed && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                  <Edit2 className="w-3.5 h-3.5" />
                  Override pending — confirm to finalize the decision.
                </div>
              )}
              {isReasonRequired && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Please add a reason to confirm this override.
                </div>
              )}
            </div>
            <div className="mt-4 rounded-lg border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Audit Trail</p>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  AI → Human → Final
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="font-medium text-gray-800">AI suggestion</p>
                    <p className="text-xs text-gray-500">
                      Team: {analysis.ownerTeam} · Priority:{" "}
                      {formatPriorityLabel(analysis.priority)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-400" />
                  <div>
                    <p className="font-medium text-gray-800">Human override</p>
                    <p className="text-xs text-gray-500">
                      {isConfirmed
                        ? hasOverride
                          ? `Adjusted to ${selectedTeam} · ${formatPriorityLabel(selectedPriority)}`
                          : "Reviewed with no changes"
                        : "Pending confirmation"}
                    </p>
                    {isConfirmed && hasOverride && overrideReason.trim().length > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Reason: {overrideReason.trim()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 h-2 w-2 rounded-full",
                      isConfirmed ? "bg-emerald-500" : "bg-gray-300"
                    )}
                  />
                  <div>
                    <p className="font-medium text-gray-800">Final decision</p>
                    <p className="text-xs text-gray-500">
                      {isConfirmed
                        ? `Team: ${displayTeam} · Priority: ${
                            formatPriorityLabel(displayPriority)
                          }`
                        : "Awaiting confirmation"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Why this decision?</p>
                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  Decision Signals
                </span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {decisionSignals.slice(0, 4).map((signal, idx) => (
                  <li key={`${signal}-${idx}`}>{signal}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader title="Summary" section="summary" />
        </CardHeader>
        {expandedSections.has("summary") && (
          <CardContent className="pt-0">
            {editingField === "summary" ? (
              <div className="space-y-2">
                <Textarea
                  value={editValues.summary as string}
                  onChange={(e) =>
                    setEditValues({ ...editValues, summary: e.target.value })
                  }
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit("summary")}>
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="w-3 h-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-gray-700">{analysis.summary}</p>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit("summary", analysis.summary)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Entities Card */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Extracted Entities"
            section="entities"
            badge={
              <Badge variant="secondary" className="text-xs">
                {Object.values(analysis.entities).flat().length} found
              </Badge>
            }
          />
        </CardHeader>
        {expandedSections.has("entities") && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(analysis.entities) as [keyof Entities, string[]][]).map(
                ([type, values]) =>
                  values.length > 0 && (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        {getEntityIcon(type)}
                        <span className="capitalize">{type}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {values.map((value, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
            {Object.values(analysis.entities).flat().length === 0 && (
              <p className="text-gray-500 text-sm">No entities extracted</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Risks & Missing Fields Card */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Risks & Missing Information"
            section="risks"
            badge={
              (analysis.riskFlags.length > 0 ||
                analysis.requiredFieldsMissing.length > 0) && (
                <Badge variant="destructive" className="text-xs">
                  {analysis.riskFlags.length + analysis.requiredFieldsMissing.length} items
                </Badge>
              )
            }
          />
        </CardHeader>
        {expandedSections.has("risks") && (
          <CardContent className="pt-0 space-y-4">
            {/* Risk Flags */}
            {analysis.riskFlags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Risk Flags</p>
                <div className="space-y-2">
                  {analysis.riskFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-lg border",
                        getSeverityColor(flag.severity)
                      )}
                    >
                      {getSeverityIcon(flag.severity)}
                      <div>
                        <p className="font-medium text-sm">{flag.flag}</p>
                        <p className="text-xs opacity-80">{flag.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Fields */}
            {analysis.requiredFieldsMissing.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Missing Information</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.requiredFieldsMissing.map((field, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="border-orange-300 text-orange-700 bg-orange-50"
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {analysis.riskFlags.length === 0 &&
              analysis.requiredFieldsMissing.length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">No risks or missing information detected</span>
                </div>
              )}
          </CardContent>
        )}
      </Card>

      {/* Checklist Card */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Recommended Checklist"
            section="checklist"
            badge={
              <Badge variant="secondary" className="text-xs">
                {analysis.checklist.length} items
              </Badge>
            }
          />
        </CardHeader>
        {expandedSections.has("checklist") && (
          <CardContent className="pt-0">
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {analysis.checklist.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50"
                  >
                    <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center mt-0.5">
                      <span className="text-xs text-gray-400">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{item.task}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>

      {/* Draft Email Card */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader title="Draft Email" section="email" />
        </CardHeader>
        {expandedSections.has("email") && (
          <CardContent className="pt-0">
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 w-16">To:</span>
                <span>{analysis.draftEmail.to.join(", ") || "—"}</span>
              </div>
              {analysis.draftEmail.cc.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16">Cc:</span>
                  <span>{analysis.draftEmail.cc.join(", ")}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="text-gray-500 w-16">Subject:</span>
                <span className="font-medium">{analysis.draftEmail.subject || "—"}</span>
              </div>
              <Separator />
              <div className="bg-gray-50 p-3 rounded whitespace-pre-wrap">
                {analysis.draftEmail.body || "No draft email generated."}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tags */}
      {analysis.suggestedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {analysis.suggestedTags.map((tag, idx) => (
            <Badge key={idx} variant="secondary">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Create Case Button */}
      {onCreateCase && (
        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => handleCreateWorkflow("detail")}
            disabled={isCreating}
          >
            {isCreating ? "Sending to Team..." : "Send to Team"}
          </Button>
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            onClick={() => handleCreateWorkflow("queue")}
            disabled={isCreating}
          >
            {isCreating ? "Opening Queue..." : "Open Case in Queue"}
          </Button>
          <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">Create Workflow</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex h-5 w-5 cursor-default items-center justify-center rounded-full border border-gray-200 text-[10px] font-semibold text-gray-500">
                        i
                      </span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>
                      Designed for high-volume enterprise document intake (e.g.,
                      procurement, vendor disputes, compliance reports).
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  Next Step
                </Badge>
              </div>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Assigned to</span>
                <span className="font-medium">{workflowQueueLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">SLA</span>
                <span className="font-medium">{getSlaHours()} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Next action</span>
                <span className="font-medium">{formatNextAction()}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Designed for high-volume enterprise document intake (e.g., procurement, vendor disputes,
            compliance reports).
          </p>
        </div>
      )}
    </div>
  );
}
