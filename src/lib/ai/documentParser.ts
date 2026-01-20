import mammoth from "mammoth";
import { createRequire } from "module";

// pdf-parse v1 exports a function (CommonJS). Use require to avoid debug mode.
async function getPdfParser() {
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  if (typeof pdfParse !== "function") {
    throw new Error("Unsupported pdf-parse module format");
  }
  return pdfParse;
}

export type SupportedFileType = "pdf" | "docx" | "txt" | "paste";

interface ParsedDocument {
  text: string;
  fileType: SupportedFileType;
  metadata?: {
    pageCount?: number;
    title?: string;
    author?: string;
  };
}

export async function parseDocument(
  file: File | Buffer,
  fileType: SupportedFileType
): Promise<ParsedDocument> {
  switch (fileType) {
    case "pdf":
      return parsePdf(file);
    case "docx":
      return parseDocx(file);
    case "txt":
      return parseTxt(file);
    case "paste":
      return parsePaste(file);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parsePdf(file: File | Buffer): Promise<ParsedDocument> {
  try {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const pdf = await getPdfParser();
    const data = await pdf(buffer);

    return {
      text: data.text.trim(),
      fileType: "pdf",
      metadata: {
        pageCount: data.numpages,
        title: data.info?.Title,
        author: data.info?.Author,
      },
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF document");
  }
}

async function parseDocx(file: File | Buffer): Promise<ParsedDocument> {
  try {
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value.trim(),
      fileType: "docx",
    };
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error("Failed to parse DOCX document");
  }
}

async function parseTxt(file: File | Buffer): Promise<ParsedDocument> {
  try {
    let text: string;
    if (file instanceof File) {
      text = await file.text();
    } else {
      text = file.toString("utf-8");
    }

    return {
      text: text.trim(),
      fileType: "txt",
    };
  } catch (error) {
    console.error("TXT parsing error:", error);
    throw new Error("Failed to parse TXT document");
  }
}

async function parsePaste(file: File | Buffer | string): Promise<ParsedDocument> {
  let text: string;
  if (typeof file === "string") {
    text = file;
  } else if (file instanceof File) {
    text = await file.text();
  } else {
    text = file.toString("utf-8");
  }

  return {
    text: text.trim(),
    fileType: "paste",
  };
}

export function detectFileType(fileName: string): SupportedFileType | null {
  const extension = fileName.toLowerCase().split(".").pop();

  switch (extension) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "txt":
      return "txt";
    default:
      return null;
  }
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

export function validateFileType(file: File): SupportedFileType | null {
  const fileType = detectFileType(file.name);
  if (fileType) return fileType;

  // Check MIME type as fallback
  const mimeType = file.type.toLowerCase();
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (mimeType === "text/plain") return "txt";

  return null;
}
