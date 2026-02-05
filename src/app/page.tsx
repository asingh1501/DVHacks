"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUpload } from "@/components/document/DocumentUpload";
import { AnalysisResults } from "@/components/document/AnalysisResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAnalysisResult, OwnerTeam, Priority } from "@/lib/types";
import { toast } from "sonner";
import {
  FileText,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { WalmartSpark } from "@/components/WalmartLogo";
import { useQuery } from "@tanstack/react-query";

interface AnalysisMetadata {
  fileName?: string;
  fileType?: string;
  textLength: number;
  analyzedAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [metadata, setMetadata] = useState<AnalysisMetadata | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [userEdits, setUserEdits] = useState<Partial<AIAnalysisResult> | null>(null);
  const [classificationConfirmation, setClassificationConfirmation] = useState<{
    ownerTeam: OwnerTeam;
    priority: Priority;
    reason: string;
    hasOverride: boolean;
    confirmedAt: string;
  } | null>(null);

  // Fetch recent cases
  const { data: recentCases } = useQuery({
    queryKey: ["recentCases"],
    queryFn: async () => {
      const res = await fetch("/api/cases?limit=5&sortBy=createdAt&sortOrder=desc");
      const data = await res.json();
      return data.data?.items || [];
    },
  });

  const handleAnalyze = async (file: File | null, text: string | null) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setUserEdits(null);
    setClassificationConfirmation(null);

    try {
      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else if (text) {
        response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        setOriginalText(text);
      } else {
        throw new Error("No content provided");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysis(data.analysis);
      setMetadata(data.metadata);

      if (file) {
        setOriginalText(data.extractedText || data.analysis.summary);
      }

      toast.success("Document analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateCase = async (mode: "detail" | "queue" = "detail") => {
    if (!analysis) return;

    setIsCreating(true);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: metadata?.fileName,
          fileType: metadata?.fileType,
          originalText: originalText || analysis.summary,
          analysisResult: analysis,
          userEdits: userEdits || undefined,
          classificationConfirmation: classificationConfirmation || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("A case with this document already exists", {
            action: {
              label: "View Case",
              onClick: () => router.push(`/cases/${data.existingCaseId}`),
            },
          });
          return;
        }
        throw new Error(data.error || "Failed to create case");
      }

      toast.success("Case created successfully!");
      if (mode === "queue") {
        router.push("/cases");
      } else {
        router.push(`/cases/${data.case.id}`);
      }
    } catch (error) {
      console.error("Create case error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create case");
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setMetadata(null);
    setOriginalText("");
    setUserEdits(null);
    setClassificationConfirmation(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hero Section */}
      {!analysis && (
        <div className="text-center mb-10 px-4">
          <div className="inline-flex items-center gap-2 bg-[#0071DC] text-white px-4 py-1.5 rounded-full text-sm font-medium mb-5 shadow-sm">
            <WalmartSpark className="w-4 h-4 text-[#FFC220]" />
            Powered by Walmart AI
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Meet <span className="text-[#0071DC]">SLATE</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Walmart&apos;s smart document intelligence layer. Upload, classify,
            route, and action — all in one place.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload or Results */}
          {analysis ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Analysis Results</h2>
                  {metadata?.fileName && (
                    <p className="text-sm text-gray-500">
                      File: {metadata.fileName}
                    </p>
                  )}
                </div>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
              <AnalysisResults
                analysis={analysis}
                onCreateCase={handleCreateCase}
                isCreating={isCreating}
                onConfirmClassification={(payload) => {
                  setClassificationConfirmation(payload);
                  setUserEdits(
                    payload.hasOverride
                      ? { ownerTeam: payload.ownerTeam, priority: payload.priority }
                      : null
                  );
                }}
              />
            </div>
          ) : (
            <DocumentUpload onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          )}

          {/* Features (shown when no analysis) */}
          {!analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card className="border-t-2 border-t-[#0071DC]">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-full bg-[#0071DC] flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Universal Parsing</h3>
                  <p className="text-sm text-gray-500">
                    Process PDFs, DOCX, and text files. Extract entities, dates, and amounts automatically.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-t-2 border-t-[#FFC220]">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-full bg-[#FFC220] flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-[#004C91]" />
                  </div>
                  <h3 className="font-bold mb-2">Smart Routing</h3>
                  <p className="text-sm text-gray-500">
                    AI classifies documents and routes to the right Walmart team with priority.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-t-2 border-t-[#004C91]">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-full bg-[#004C91] flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">Risk Detection</h3>
                  <p className="text-sm text-gray-500">
                    Flag compliance gaps, missing fields, and potential risks before they escalate.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Recent Cases
                <Link href="/cases">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCases && recentCases.length > 0 ? (
                <div className="space-y-3">
                  {recentCases.slice(0, 5).map((caseItem: any) => (
                    <Link
                      key={caseItem.id}
                      href={`/cases/${caseItem.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {caseItem.summary?.slice(0, 50)}...
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {caseItem.docType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {caseItem.ownerTeam}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No cases yet. Upload a document to get started with SLATE.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-[#0071DC] text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg text-white">How SLATE Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC220] mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Drag and drop files or paste text directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC220] mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Supports PDF, DOCX, and TXT formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC220] mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Review and edit AI suggestions before saving</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FFC220] mt-0.5 flex-shrink-0" />
                  <span className="text-white/90">Full audit trail for every decision</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
