import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { SettingsView } from "@/components/settings-view";

export const dynamic = "force-dynamic";

const DEFAULT_PREFS = {
  email_when_ready: false,
  retention_days: 90 as 30 | 90 | 180,
};

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userMeta = (user?.user_metadata as { full_name?: string; preferences?: typeof DEFAULT_PREFS }) || {};
  const prefs = userMeta.preferences ?? DEFAULT_PREFS;

  const { data: connections } = await supabase
    .from("user_connections")
    .select("provider, status");

  return (
    <AppShell userEmail={user?.email ?? null} userName={userMeta.full_name ?? null}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="dsg-page-title text-2xl sm:text-3xl mb-8">Settings</h1>
        <SettingsView
          email={user?.email ?? ""}
          fullName={userMeta.full_name ?? ""}
          initialEmailWhenReady={prefs.email_when_ready ?? false}
          initialRetentionDays={prefs.retention_days ?? 90}
          connections={connections ?? []}
        />
      </div>
    </AppShell>
  );
}
