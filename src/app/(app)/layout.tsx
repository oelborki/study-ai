import { auth } from "@/auth";
import Sidebar from "@/components/ui/Sidebar";
import { SidebarProvider } from "@/components/ui/SidebarContext";
import AppShell from "@/components/ui/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar user={user} />
        <AppShell>{children}</AppShell>
      </div>
    </SidebarProvider>
  );
}
