"use client";

import { useSidebar } from "./SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={`flex-1 transition-all duration-200 ${
        collapsed ? "md:ml-16" : "md:ml-60"
      }`}
    >
      {children}
    </main>
  );
}
