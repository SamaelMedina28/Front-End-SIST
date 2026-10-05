"use client";

import { useState, type ReactNode } from "react";

import { MainContent } from "@/components/layout/main-content";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { CurrentUser } from "@/features/auth/api";

export function AppShell({ children, user }: { children: ReactNode; user?: CurrentUser }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:fixed md:inset-y-0 md:flex"><Sidebar /></div>
      <div className="md:pl-64"><Topbar user={user} onMenuClick={() => setMobileNavigationOpen(true)} /><MainContent>{children}</MainContent></div>
      <MobileNavigation onOpenChange={setMobileNavigationOpen} open={mobileNavigationOpen} />
    </div>
  );
}
