"use client";

import { usePathname } from "next/navigation";

const AUTH_PREFIXES = ["/dashboard", "/upload", "/deck", "/teams", "/settings"];

export default function HeaderConditional({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAuthRoute) return null;
  return <>{children}</>;
}
