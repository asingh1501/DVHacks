import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const maxDuration = 60;

interface OCRResult {
  success: boolean;
  text?: string;
  metadata?: {
    page_count: number;
    method: string;
  };
  error?: string;
}

/**
 * Call Python OCR service to extract text from PDF
 */
async function extractTextWithOCR(pdfBuffer: Buffer, forceOCR = false): Promise<OCRResult> {
  return new Promise(async (resolve, reject) => {
    try {
      // Save PDF to temporary file
      const tempFilePath = join(tmpdir(), `ocr-${Date.now()}.pdf`);
      await writeFile(tempFilePath, pdfBuffer);

      // Path to Python script
      const scriptPath = join(process.cwd(), "python-services", "ocr_service.py");
      
      // Spawn Python process
      const args = [scriptPath, tempFilePath];
      if (forceOCR) args.push("--force-ocr");
      
      const pythonProcess = spawn("python3", args);

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", async (code) => {
        // Clean up temp file
        try {
          await unlink(tempFilePath);
        } catch (e) {
          console.error("Failed to delete temp file:", e);
        }

        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse OCR result: ${stdout}`));
        }
      });

      pythonProcess.on("error", async (error) => {
        // Clean up temp file
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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const forceOCR = formData.get("forceOCR") === "true";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB" },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using OCR
    const result = await extractTextWithOCR(buffer, forceOCR);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "OCR extraction failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      text: result.text,
      metadata: {
        ...result.metadata,
        fileName: file.name,
        fileSize: file.size,
      },
    });
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process PDF",
      },
      { status: 500 }
    );
  }
}
