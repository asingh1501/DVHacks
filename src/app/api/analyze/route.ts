import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analyzer";
import { parseDocument, validateFileType, validateFileSize, SupportedFileType } from "@/lib/ai/documentParser";
import { AIAnalysisResult, DocType } from "@/lib/types";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 60;

/**
 * Extract text from PDF using Python OCR service
 */
async function extractPdfWithOCR(fileBuffer: Buffer): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const tempFilePath = join(tmpdir(), `ocr-${Date.now()}.pdf`);
      await writeFile(tempFilePath, fileBuffer);

      const scriptPath = join(process.cwd(), "python-services", "ocr_service.py");
      const pythonProcess = spawn("python3", [scriptPath, tempFilePath]);

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        try {
          await unlink(tempFilePath);
        } catch (e) {
          console.error("Failed to delete temp file:", e);
        }

        if (code !== 0) {
          reject(new Error(`OCR process failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.success && result.text) {
            resolve(result.text);
          } else {
            reject(new Error(result.error || "OCR extraction failed"));
          }
        } catch (e) {
          reject(new Error(`Failed to parse OCR output: ${stdout}`));
        }
      });

      pythonProcess.on("error", async (error) => {
        try {
          await unlink(tempFilePath);
        } catch (e) {
          console.error("Failed to delete temp file:", e);
        }
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

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

        console.log(`[SLATE] Initial extraction: ${text.length} chars, fileType: ${fileType}`);

        // For PDFs, try OCR if text extraction yielded little/no content
        if (fileType === "pdf" && text.length < 500) {
          console.log(`[SLATE] PDF text is short (${text.length} chars), attempting OCR...`);
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ocrText = await extractPdfWithOCR(buffer);
            if (ocrText && ocrText.length > text.length) {
              console.log(`[SLATE] OCR extracted ${ocrText.length} chars (vs ${text.length} from pdf-parse), using OCR text`);
              text = ocrText;
            }
          } catch (ocrError) {
            console.warn("[SLATE] OCR not available:", ocrError instanceof Error ? ocrError.message : ocrError);
          }
        }

        // If we still have no real text, return a clear error
        if (!text || text.length < 10) {
          console.error(`[SLATE] Failed to extract text from PDF. Final text length: ${text?.length || 0}`);
          return NextResponse.json(
            { error: "Could not extract text from this PDF. It may be image-based. Try copy-pasting the text manually using the Paste Text tab." },
            { status: 422 }
          );
        }

        console.log(`[SLATE] Final text for analysis: ${text.length} chars. Preview: "${text.slice(0, 150)}..."`);
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
      extractedText: text,
      metadata: {
        fileName,
        fileType,
        textLength: text.length,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to analyze document. Please try again.",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
