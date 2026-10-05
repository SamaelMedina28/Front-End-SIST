"use client";

import { useState, type ReactNode } from "react";

import { MainContent } from "@/components/layout/main-content";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:fixed md:inset-y-0 md:flex"><Sidebar /></div>
      <div className="md:pl-64"><Topbar onMenuClick={() => setMobileNavigationOpen(true)} /><MainContent>{children}</MainContent></div>
      <MobileNavigation onOpenChange={setMobileNavigationOpen} open={mobileNavigationOpen} />
    </div>
  );
}
