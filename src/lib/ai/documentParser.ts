import mammoth from "mammoth";

// Dynamic import for pdf-parse
let pdfParseCache: any = null;

async function getPdfParser() {
  if (pdfParseCache) {
    return pdfParseCache;
  }
  
  try {
    // Try dynamic import
    const pdfParse = await import("pdf-parse");
    pdfParseCache = pdfParse.default || pdfParse;
    return pdfParseCache;
  } catch (error) {
    console.error("Failed to load pdf-parse:", error);
    throw new Error("PDF parsing library not available");
  }
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
    
    // Try standard PDF parsing
    try {
      const pdf = await getPdfParser();
      const data = await pdf(buffer);
      
      const extractedText = data.text ? data.text.trim() : "";
      
      return {
        text: extractedText || "PDF uploaded but no text extracted. May require OCR.",
        fileType: "pdf",
        metadata: {
          pageCount: data.numpages || 0,
          title: data.info?.Title,
          author: data.info?.Author,
        },
      };
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      // Return minimal response instead of failing
      return {
        text: "PDF uploaded but could not be parsed. May be corrupted or require OCR.",
        fileType: "pdf",
        metadata: {
          pageCount: 0,
        },
      };
    }
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to process PDF file");
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
