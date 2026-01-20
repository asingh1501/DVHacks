import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analyzer";
import { parseDocument, validateFileType, validateFileSize, SupportedFileType } from "@/lib/ai/documentParser";
import { AIAnalysisResult, DocType } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let text: string;
    let fileType: SupportedFileType = "paste";
    let fileName: string | undefined;
    let mockMode = false;
    let docTypeHint: DocType | undefined;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const pastedText = formData.get("text") as string | null;
      mockMode = formData.get("mockMode") === "true";
      docTypeHint = formData.get("docType") as DocType | undefined;

      if (file && file.size > 0) {
        // Validate file
        const detectedType = validateFileType(file);
        if (!detectedType) {
          return NextResponse.json(
            { error: "Unsupported file format. Please upload PDF, DOCX, or TXT files." },
            { status: 400 }
          );
        }

        if (!validateFileSize(file, 10)) {
          return NextResponse.json(
            { error: "File too large. Maximum size is 10MB." },
            { status: 413 }
          );
        }

        fileType = detectedType;
        fileName = file.name;

        // Parse document
        const parsed = await parseDocument(file, fileType);
        text = parsed.text;
      } else if (pastedText) {
        text = pastedText.trim();
        fileType = "paste";
      } else {
        return NextResponse.json(
          { error: "No file or text provided" },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/json")) {
      // Handle JSON request
      const body = await request.json();
      text = body.text?.trim();
      mockMode = body.mockMode || false;
      docTypeHint = body.docType;

      if (!text) {
        return NextResponse.json(
          { error: "No text provided" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: "Document content is too short for analysis" },
        { status: 400 }
      );
    }

    // Analyze document
    const analysis = await analyzeDocument(text, { mockMode, docTypeHint });

    return NextResponse.json({
      success: true,
      analysis,
      metadata: {
        fileName,
        fileType,
        textLength: text.length,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze document. Please try again." },
      { status: 500 }
    );
  }
}
