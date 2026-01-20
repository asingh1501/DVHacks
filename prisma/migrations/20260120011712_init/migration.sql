-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "originalText" TEXT NOT NULL,
    "documentHash" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "entities" TEXT NOT NULL,
    "ownerTeam" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "aiRationale" TEXT NOT NULL,
    "missingFields" TEXT NOT NULL,
    "riskFlags" TEXT NOT NULL,
    "complianceIssues" TEXT,
    "checklist" TEXT NOT NULL,
    "draftEmail" TEXT NOT NULL,
    "suggestedActions" TEXT NOT NULL,
    "userEdits" TEXT,
    "editedFields" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assignedTo" TEXT,
    "tags" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'system',
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "changes" TEXT,
    CONSTRAINT "AuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'User',
    "noteType" TEXT NOT NULL DEFAULT 'general',
    CONSTRAINT "CaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL DEFAULT 'User',
    CONSTRAINT "Attachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
