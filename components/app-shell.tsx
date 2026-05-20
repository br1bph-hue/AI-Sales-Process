import { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { BrandFooter } from "@/components/footer";

interface AppShellProps {
  userEmail: string | null;
  userName?: string | null;
  children: ReactNode;
}

export function AppShell({ userEmail, userName, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-dsg-gray-50">
      <AppHeader userEmail={userEmail} userName={userName} />
      <main className="flex-1">{children}</main>
      <BrandFooter />
    </div>
  );
}
