"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalmartSpark } from "@/components/WalmartLogo";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Upload", icon: Plus },
    { href: "/cases", label: "Cases", icon: FolderOpen },
  ];

  return (
    <>
      {/* Walmart blue accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#004C91] via-[#0071DC] to-[#FFC220]" />
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <WalmartSpark className="w-8 h-8 text-[#FFC220]" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-lg tracking-tight text-[#004C91]">
                SLATE
              </span>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                by Walmart
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 font-medium",
                    pathname === item.href
                      ? "bg-[#0071DC] text-white hover:bg-[#004C91]"
                      : "text-gray-600 hover:text-[#0071DC] hover:bg-[#0071DC]/5"
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
    </>
  );
}
