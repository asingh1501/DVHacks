"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  Eye,
  Archive,
  Trash2,
  Copy,
  FileText,
  FileSignature,
  User,
  AlertTriangle,
  Calendar,
  Shield,
  Mail,
  ShoppingCart,
  Presentation,
  File,
} from "lucide-react";
import { CaseWithRelations, DocType } from "@/lib/types";
import {
  cn,
  getPriorityColor,
  getStatusColor,
  getTeamColor,
  formatRelativeTime,
  truncateText,
  getStatusDisplayName,
  getDocTypeDisplayName,
} from "@/lib/utils";

interface CasesTableProps {
  cases: CaseWithRelations[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const docTypeIcons: Record<DocType, React.ReactNode> = {
  invoice: <FileText className="w-4 h-4" />,
  contract: <FileSignature className="w-4 h-4" />,
  resume: <User className="w-4 h-4" />,
  incident_report: <AlertTriangle className="w-4 h-4" />,
  meeting_notes: <Calendar className="w-4 h-4" />,
  policy: <Shield className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  purchase_order: <ShoppingCart className="w-4 h-4" />,
  proposal: <Presentation className="w-4 h-4" />,
  other: <File className="w-4 h-4" />,
};

export function CasesTable({
  cases,
  isLoading,
  onDelete,
  onArchive,
  selectedIds = [],
  onSelectionChange,
}: CasesTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelection = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === cases.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(cases.map((c) => c.id));
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-32">Case ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-1/3">Summary</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <File className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
        <p className="text-gray-500 mb-4">
          Upload your first document to create a case.
        </p>
        <Link href="/">
          <Button>Upload Document</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {onSelectionChange && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === cases.length && cases.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
            )}
            <TableHead className="w-32">Case ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-1/3">Summary</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseItem) => (
            <TableRow
              key={caseItem.id}
              className={cn(
                "hover:bg-gray-50 cursor-pointer",
                selectedIds.includes(caseItem.id) && "bg-[#0071DC]/10"
              )}
            >
              {onSelectionChange && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(caseItem.id)}
                    onCheckedChange={() => toggleSelection(caseItem.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {caseItem.id.slice(0, 8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyId(caseItem.id);
                    }}
                  >
                    <Copy className={cn("w-3 h-3", copiedId === caseItem.id && "text-green-500")} />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">
                    {docTypeIcons[caseItem.docType]}
                  </span>
                  <span className="text-sm">{getDocTypeDisplayName(caseItem.docType)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Link href={`/cases/${caseItem.id}`} className="hover:underline">
                  <p className="text-sm text-gray-700">
                    {truncateText(caseItem.summary, 80)}
                  </p>
                </Link>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-white text-xs", getTeamColor(caseItem.ownerTeam))}>
                  {caseItem.ownerTeam}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs", getPriorityColor(caseItem.priority))}>
                  {caseItem.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs", getStatusColor(caseItem.status))}>
                  {getStatusDisplayName(caseItem.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-500">
                  {formatRelativeTime(caseItem.createdAt)}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/cases/${caseItem.id}`}>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </Link>
                    {onArchive && (
                      <DropdownMenuItem onClick={() => onArchive(caseItem.id)}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(caseItem.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
