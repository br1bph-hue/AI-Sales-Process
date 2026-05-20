import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { HistoryTable } from "@/components/history-table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userMeta = (user?.user_metadata as { full_name?: string }) || {};

  const { data: runs } = await supabase
    .from("skill_runs")
    .select(
      "id, inputs, status, created_at, completed_at, output_file_id, skill_outputs(id, filename, expires_at)"
    )
    .order("created_at", { ascending: false });

  return (
    <AppShell userEmail={user?.email ?? null} userName={userMeta.full_name ?? null}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="dsg-page-title text-2xl sm:text-3xl">History</h1>
          <Button asChild variant="secondary">
            <Link href="/skills/prospect-dossier">New dossier</Link>
          </Button>
        </div>

        {runs && runs.length > 0 ? (
          <HistoryTable runs={runs} />
        ) : (
          <div className="dsg-card p-10 text-center">
            <p className="text-sm text-dsg-gray-700">
              You haven't generated any dossiers yet. Start with the company
              you're calling first this week.
            </p>
            <Button asChild className="mt-5">
              <Link href="/skills/prospect-dossier">Open Prospect Dossier</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
