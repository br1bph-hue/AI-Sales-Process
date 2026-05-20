import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { ProspectDossierWorkspace } from "@/components/prospect-dossier/workspace";

export const dynamic = "force-dynamic";

export default async function ProspectDossierPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userMeta = (user?.user_metadata as { full_name?: string }) || {};

  const { data: connections } = await supabase
    .from("user_connections")
    .select("provider, status");

  const crm = connections?.find((c) =>
    ["hubspot", "salesforce", "close", "pipedrive"].includes(c.provider)
  );
  const email = connections?.find((c) =>
    ["outlook", "gmail"].includes(c.provider)
  );

  return (
    <AppShell userEmail={user?.email ?? null} userName={userMeta.full_name ?? null}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-dsg-gray-500">
            Skill 1 of 13
          </p>
          <h1 className="dsg-page-title text-2xl sm:text-3xl mt-1">
            Prospect Dossier
          </h1>
          <p className="mt-2 text-sm text-dsg-gray-500 max-w-2xl">
            One page on a target company: signals, pain points, contacts, and
            an opening line. Sixty to ninety seconds.
          </p>
        </div>

        <Suspense fallback={<div className="dsg-card p-6">Loading…</div>}>
          <ProspectDossierWorkspace
            crmConnection={
              crm ? { provider: crm.provider, status: crm.status } : null
            }
            emailConnection={
              email ? { provider: email.provider, status: email.status } : null
            }
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
