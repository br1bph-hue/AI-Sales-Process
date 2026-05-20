"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface AppHeaderProps {
  userEmail: string | null;
  userName?: string | null;
}

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function AppHeader({ userEmail, userName }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Account");

  return (
    <header className="border-b border-dsg-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-dsg-navy text-lg font-semibold tracking-tight"
            >
              DSG Distribution Sales OS
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-dsg-gray-700 hover:text-dsg-navy"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-dsg-gray-700">{displayName}</span>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              Log out
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-6">
                <div>
                  <p className="text-sm font-semibold text-dsg-gray-900">{displayName}</p>
                  {userEmail && (
                    <p className="text-xs text-dsg-gray-500 mt-1">{userEmail}</p>
                  )}
                </div>
                <nav className="flex flex-col gap-3">
                  {nav.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="text-base text-dsg-gray-900 hover:text-dsg-navy"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                <Button variant="secondary" onClick={handleSignOut}>
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
