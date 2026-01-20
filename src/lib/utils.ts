import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import CryptoJS from "crypto-js"
import { formatDistanceToNow, format } from "date-fns"
import { Priority, CaseStatus, OwnerTeam, DocType } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate SHA-256 hash for document deduplication
export function generateDocumentHash(text: string): string {
  return CryptoJS.SHA256(text).toString()
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// Format date
export function formatDate(date: Date | string, formatStr: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, formatStr)
}

// Priority color mapping
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  }
  return colors[priority]
}

// Status color mapping
export function getStatusColor(status: CaseStatus): string {
  const colors: Record<CaseStatus, string> = {
    new: "bg-purple-100 text-purple-800",
    in_progress: "bg-blue-100 text-blue-800",
    pending_review: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  }
  return colors[status]
}

// Team color mapping
export function getTeamColor(team: OwnerTeam): string {
  const colors: Record<OwnerTeam, string> = {
    AP: "bg-purple-500",
    Legal: "bg-blue-700",
    HR: "bg-teal-500",
    Ops: "bg-orange-500",
    Support: "bg-pink-500",
    Sales: "bg-green-600",
    IT: "bg-indigo-500",
    Finance: "bg-emerald-600",
    Procurement: "bg-amber-600",
    Unknown: "bg-gray-500",
  }
  return colors[team]
}

// Document type icon mapping
export function getDocTypeIcon(docType: DocType): string {
  const icons: Record<DocType, string> = {
    invoice: "FileText",
    contract: "FileSignature",
    resume: "User",
    incident_report: "AlertTriangle",
    meeting_notes: "Calendar",
    policy: "Shield",
    email: "Mail",
    purchase_order: "ShoppingCart",
    proposal: "Presentation",
    other: "File",
  }
  return icons[docType]
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

// Parse JSON safely
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Confidence score to percentage
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

// Status display name
export function getStatusDisplayName(status: CaseStatus): string {
  const names: Record<CaseStatus, string> = {
    new: "New",
    in_progress: "In Progress",
    pending_review: "Pending Review",
    resolved: "Resolved",
    archived: "Archived",
  }
  return names[status]
}

// Doc type display name
export function getDocTypeDisplayName(docType: DocType): string {
  const names: Record<DocType, string> = {
    invoice: "Invoice",
    contract: "Contract",
    resume: "Resume",
    incident_report: "Incident Report",
    meeting_notes: "Meeting Notes",
    policy: "Policy",
    email: "Email",
    purchase_order: "Purchase Order",
    proposal: "Proposal",
    other: "Other",
  }
  return names[docType]
}
