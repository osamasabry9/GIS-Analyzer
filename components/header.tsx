"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mountain, Map, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-background/70 backdrop-blur">
      <div className="container mx-auto h-14 px-4 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <Mountain className="h-5 w-5 text-emerald-400" />
          <span className="font-semibold">GIS Analyzer</span>
        </Link>
        <nav className="ml-4 hidden md:flex items-center gap-1">
          <Button
            asChild
            variant={pathname === "/map" ? "default" : "ghost"}
          >
            <Link href="/map">
              <Map className="mr-2 h-4 w-4" />
              Map
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/settings" ? "default" : "ghost"}
          >
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </nav>
        {/* Dark mode removed: single light theme */}
        <div className="ml-auto" />
      </div>
    </header>
  );
}
