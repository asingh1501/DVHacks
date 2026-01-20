"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUpload } from "@/components/document/DocumentUpload";
import { AnalysisResults } from "@/components/document/AnalysisResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AIAnalysisResult } from "@/lib/types";
import { toast } from "sonner";
import {
  FileText,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
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
        const fileText = await file.text().catch(() => "");
        setOriginalText(fileText || data.analysis.summary);
      }

      toast.success("Document analyzed successfully!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to analyze document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateCase = async () => {
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
      router.push(`/cases/${data.case.id}`);
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
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Hero Section */}
      {!analysis && (
        <div className="text-center mb-8 px-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Document Intelligence
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Documents into
            <span className="text-blue-600"> Actionable Intelligence</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload any document and let AI extract data, classify content, detect risks,
            and generate actionable workflows automatically.
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
              />
            </div>
          ) : (
            <DocumentUpload onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          )}

          {/* Features (shown when no analysis) */}
          {!analysis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Universal Parsing</h3>
                  <p className="text-sm text-gray-600">
                    Process PDFs, DOCX, and text files. Extract entities, dates, and amounts automatically.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Smart Routing</h3>
                  <p className="text-sm text-gray-600">
                    AI classifies documents and suggests the right team and priority level.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Risk Detection</h3>
                  <p className="text-sm text-gray-600">
                    Identify missing information, compliance issues, and potential risks.
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
                  No cases yet. Upload a document to get started!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Drag and drop files or paste text directly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Supports PDF, DOCX, and TXT formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Review and edit AI suggestions before saving</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>All changes are tracked in the audit trail</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
