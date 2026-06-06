import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { SkillStubWorkspace } from "@/components/skill-stub-workspace";
import { SKILL_STUBS } from "@/lib/skill-stubs";

export const dynamic = "force-dynamic";

const SKILL_ID = "win-loss";

export default async function Page() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userMeta = (user?.user_metadata as { full_name?: string }) || {};
  const skill = SKILL_STUBS[SKILL_ID];

  return (
    <AppShell userEmail={user?.email ?? null} userName={userMeta.full_name ?? null}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-dsg-gray-500">
            Skill {skill.skillNumber} of 13
          </p>
          <h1 className="dsg-page-title text-2xl sm:text-3xl mt-1">
            {skill.title}
          </h1>
        </div>
        <SkillStubWorkspace skill={skill} />
      </div>
    </AppShell>
  );
}
