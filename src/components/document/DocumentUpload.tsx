"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, FileType, File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onAnalyze: (file: File | null, text: string | null) => Promise<void>;
  isLoading: boolean;
}

export function DocumentUpload({ onAnalyze, isLoading }: DocumentUploadProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleAnalyze = async () => {
    if (activeTab === "upload" && selectedFile) {
      await onAnalyze(selectedFile, null);
    } else if (activeTab === "paste" && pastedText.trim()) {
      await onAnalyze(null, pastedText.trim());
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop();
    switch (ext) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "docx":
      case "doc":
        return <FileType className="w-8 h-8 text-[#0071DC]" />;
      case "txt":
        return <File className="w-8 h-8 text-gray-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const canAnalyze =
    (activeTab === "upload" && selectedFile) ||
    (activeTab === "paste" && pastedText.trim().length >= 10);

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-[#0071DC] bg-[#0071DC]/5"
                  : "border-gray-300 hover:border-[#0071DC]/50",
                selectedFile && "border-green-500 bg-green-50"
              )}
            >
              <input {...getInputProps()} />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {isDragActive ? "Drop the file here" : "Drag and drop a document"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports PDF, DOCX, TXT (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paste">
            <Textarea
              placeholder="Paste your document content here..."
              className="min-h-[200px] resize-none"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              {pastedText.length} characters
              {pastedText.length > 0 && pastedText.length < 10 && (
                <span className="text-red-500 ml-2">
                  (minimum 10 characters required)
                </span>
              )}
            </p>
          </TabsContent>
        </Tabs>

        <Button
          className="w-full mt-6 bg-[#0071DC] hover:bg-[#004C91] text-white font-semibold shadow-sm"
          size="lg"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              SLATE is analyzing...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Analyze with SLATE
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
