"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Upload", icon: Plus },
    { href: "/cases", label: "Cases", icon: FolderOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">
            DocOps <span className="text-blue-600">Copilot</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "gap-2",
                  pathname === item.href && "bg-blue-50 text-blue-700"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
