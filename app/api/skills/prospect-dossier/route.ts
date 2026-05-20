import { NextRequest, NextResponse } from "next/server";
import { dossierInputSchema } from "@/lib/dossier-schema";
import { apiError, requireUser } from "@/lib/api/auth";
import { buildStubResponse } from "@/lib/api/dossier-stub";

const RATE_LIMIT_PER_HOUR = 10;
const STUB_DURATION_MS = 5000;

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { user, supabase } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", "Request body must be JSON.", 400);
  }

  const parsed = dossierInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "invalid_input",
      parsed.error.issues[0]?.message ?? "Bad input.",
      400
    );
  }
  const input = parsed.data;

  // Rate limit: 10 per hour per user.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("skill_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("skill", "prospect-dossier")
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return apiError(
      "rate_limited",
      "You've hit the hourly limit (10 dossiers per hour).",
      429,
      { retry_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() }
    );
  }

  // Stubbed name collision: bare "crescent" surfaces candidates.
  const wantsCollisionInterrupt =
    input.options?.interrupt_on_name_collision !== false;
  const disambiguated = input.options?.disambiguated_company;
  if (
    wantsCollisionInterrupt &&
    !disambiguated &&
    /^crescent\s*$/i.test(input.company_name)
  ) {
    return NextResponse.json(
      {
        error: {
          code: "name_collision",
          message: "Multiple companies match this name. Pick one to continue.",
          candidates: [
            {
              name: "Crescent Electric Supply Company",
              hq_city: "East Dubuque, IL",
              revenue_estimate: "$1.5B",
              segment: "electrical",
            },
            {
              name: "Crescent Electric Service",
              hq_city: "Brooklyn, NY",
              revenue_estimate: "<$10M",
              segment: "contractor",
            },
          ],
        },
      },
      { status: 409 }
    );
  }

  const startedAt = new Date().toISOString();

  const { data: runRow, error: insertErr } = await supabase
    .from("skill_runs")
    .insert({
      user_id: user.id,
      skill: "prospect-dossier",
      version: "1.0",
      inputs: input,
      status: "running",
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (insertErr || !runRow) {
    // Schema not applied yet: short-circuit with a pure stub response.
    const stub = buildStubResponse(input, STUB_DURATION_MS);
    return NextResponse.json(stub, { status: 200 });
  }

  const runId = runRow.id as string;
  const stub = buildStubResponse(input, STUB_DURATION_MS, runId);
  const storagePath = `outputs/${user.id}/prospect-dossier/${runId}.docx`;

  // Persist a fake completed run synchronously so History shows it.
  const { data: outputRow } = await supabase
    .from("skill_outputs")
    .insert({
      user_id: user.id,
      skill_run_id: runId,
      storage_path: storagePath,
      filename: stub.output.filename,
      size_bytes: stub.output.size_bytes,
    })
    .select("id")
    .single();

  await supabase
    .from("skill_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_ms: stub.duration_ms,
      output_file_id: outputRow?.id ?? null,
      highlights: stub.highlights,
    })
    .eq("id", runId);

  return NextResponse.json(
    {
      ...stub,
      request_id: runId,
      output: { ...stub.output, file_id: outputRow?.id ?? runId },
    },
    { status: 200 }
  );
}
