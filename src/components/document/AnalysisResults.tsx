"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { AIAnalysisResult, RiskFlag, ChecklistItem, Entities } from "@/lib/types";
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
  onCreateCase?: () => void;
  isCreating?: boolean;
}

export function AnalysisResults({
  analysis,
  onEdit,
  onCreateCase,
  isCreating,
}: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["classification", "summary", "entities", "risks"])
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Document Type</p>
                <Badge variant="outline" className="text-sm">
                  {getDocTypeDisplayName(analysis.docType)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Assigned Team</p>
                <Badge className={cn("text-white", getTeamColor(analysis.ownerTeam))}>
                  {analysis.ownerTeam}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Priority</p>
                <Badge className={getPriorityColor(analysis.priority)}>
                  {analysis.priority.charAt(0).toUpperCase() + analysis.priority.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Confidence</p>
                <div className="flex items-center gap-2">
                  <Progress value={analysis.confidence * 100} className="h-2 flex-1" />
                  <span className="text-sm font-medium">
                    {formatConfidence(analysis.confidence)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 italic">{analysis.rationale}</p>
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
        <Button
          className="w-full"
          size="lg"
          onClick={onCreateCase}
          disabled={isCreating}
        >
          {isCreating ? "Creating Case..." : "Save as Case"}
        </Button>
      )}
    </div>
  );
}
