"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";
import type { User } from "next-auth";

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Upload",
    href: "/upload",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: "Teams",
    href: "/teams",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideDesktop =
        desktopProfileRef.current?.contains(target) ?? false;
      const insideMobile =
        mobileProfileRef.current?.contains(target) ?? false;
      if (!insideDesktop && !insideMobile) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const brandingIcon = (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#06B6D4"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );

  const avatar = user?.image ? (
    <Image
      src={user.image}
      alt={user.name || "User"}
      width={32}
      height={32}
      className="rounded-full shrink-0"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-[#0891B2] flex items-center justify-center text-xs text-white font-semibold shrink-0">
      {(user?.name || user?.email || "U")[0].toUpperCase()}
    </div>
  );

  const navContent = (expanded: boolean) => (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={!expanded ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              expanded ? "" : "justify-center"
            } ${
              active
                ? "border-l-2 border-[#06B6D4] bg-white/5 text-[#06B6D4]"
                : "border-l-2 border-transparent text-[#94A3B8] hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.icon}
            {expanded && item.label}
          </Link>
        );
      })}
    </nav>
  );

  const renderProfileDropdown = (expanded: boolean) => (
    profileOpen && (
      <div
        className={`absolute z-50 w-56 rounded-lg bg-[#1a1a24] border border-white/10 shadow-xl py-1 ${
          expanded
            ? "bottom-full left-3 mb-2"
            : "left-full bottom-0 ml-2"
        }`}
      >
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-sm font-medium text-white truncate">
            {user?.name}
          </p>
          <p className="text-xs text-[#737373] truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#f87171] hover:bg-white/[0.03] transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign out
        </button>
      </div>
    )
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-[#0c0c12] border border-white/10 p-2 text-[#94A3B8] hover:text-white md:hidden"
        aria-label="Open sidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-[#0c0c12] border-r border-white/10 transition-all duration-200 z-40 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Branding */}
        <div
          className={`flex items-center gap-3 border-b border-white/10 px-4 py-4 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {brandingIcon}
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight">
              QuickyNotes
            </span>
          )}
          <button
            onClick={toggle}
            className={`text-[#94A3B8] hover:text-white transition-colors ${
              collapsed ? "hidden" : "ml-auto"
            }`}
            aria-label="Collapse sidebar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={toggle}
            className="mx-auto mt-2 text-[#94A3B8] hover:text-white transition-colors"
            aria-label="Expand sidebar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          {navContent(!collapsed)}
        </div>

        {/* User profile */}
        {user && (
          <div className="relative border-t border-white/10 p-3" ref={desktopProfileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-[#94A3B8] hover:bg-white/5 hover:text-white transition-colors ${
                !collapsed ? "" : "justify-center"
              }`}
            >
              {avatar}
              {!collapsed && (
                <span className="truncate text-left flex-1">
                  {user?.name || "Account"}
                </span>
              )}
            </button>
            {renderProfileDropdown(!collapsed)}
          </div>
        )}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 w-60 bg-[#0c0c12] border-r border-white/10 transform transition-transform duration-200 md:hidden flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          {brandingIcon}
          <span className="text-lg font-bold text-white tracking-tight">
            QuickyNotes
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-[#94A3B8] hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">{navContent(true)}</div>

        {/* User profile */}
        {user && (
          <div className="relative border-t border-white/10 p-3" ref={mobileProfileRef}>
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-[#94A3B8] hover:bg-white/5 hover:text-white transition-colors"
            >
              {avatar}
              <span className="truncate text-left flex-1">
                {user?.name || "Account"}
              </span>
            </button>
            {renderProfileDropdown(true)}
          </div>
        )}
      </aside>
    </>
  );
}
