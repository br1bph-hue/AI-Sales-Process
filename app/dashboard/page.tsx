import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { SkillCard } from "@/components/skill-card";
import { RecentActivity } from "@/components/recent-activity";
import { SKILLS } from "@/lib/skills";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userMeta = (user?.user_metadata as { full_name?: string }) || {};

  const { data: recentRuns } = await supabase
    .from("skill_runs")
    .select(
      "id, inputs, status, created_at, completed_at, output_file_id, skill_outputs(filename, storage_path)"
    )
    .eq("skill", "prospect-dossier")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AppShell userEmail={user?.email ?? null} userName={userMeta.full_name ?? null}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="dsg-page-title text-2xl sm:text-3xl">
            Distribution Sales OS
          </h1>
          <p className="mt-2 text-sm text-dsg-gray-500 max-w-2xl">
            Thirteen skills your team will use every week. Pick one to start.
          </p>
        </div>

        <section aria-labelledby="skills-heading">
          <h2 id="skills-heading" className="sr-only">Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SKILLS.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="recent-heading">
          <div className="flex items-baseline justify-between mb-4">
            <h2 id="recent-heading" className="dsg-section-header text-lg">
              Recent activity
            </h2>
            <Link
              href="/history"
              className="text-sm text-dsg-navy hover:underline"
            >
              View all
            </Link>
          </div>
          <RecentActivity runs={recentRuns ?? []} />
        </section>
      </div>
    </AppShell>
  );
}
