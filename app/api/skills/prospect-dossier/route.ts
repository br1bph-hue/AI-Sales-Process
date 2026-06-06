import { NextRequest, NextResponse } from "next/server";
import { dossierInputSchema } from "@/lib/dossier-schema";
import { apiError, requireUser } from "@/lib/api/auth";
import { buildStubResponse } from "@/lib/api/dossier-stub";
import {
  callDossierSidecar,
  sidecarConfigured,
  SidecarError,
} from "@/lib/api/sidecar";

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
  const storagePath = `outputs/${user.id}/prospect-dossier/${runId}.docx`;

  // Try the real sidecar first. On absence (env unset) or failure, fall
  // back to the in-process stub so the UI keeps working in dev / before
  // the Python service ships.
  let filename: string;
  let sizeBytes: number;
  let durationMs: number;
  let highlights = buildStubResponse(input, STUB_DURATION_MS, runId).highlights;
  let docxBytes: Buffer | null = null;

  if (sidecarConfigured()) {
    try {
      const sidecar = await callDossierSidecar({
        run_id: runId,
        user_id: user.id,
        input,
      });
      if (sidecar) {
        docxBytes = Buffer.from(sidecar.docx_base64, "base64");
        filename = sidecar.filename;
        sizeBytes = sidecar.size_bytes || docxBytes.length;
        durationMs = sidecar.duration_ms;
        highlights = sidecar.highlights;
      } else {
        const stub = buildStubResponse(input, STUB_DURATION_MS, runId);
        filename = stub.output.filename;
        sizeBytes = stub.output.size_bytes;
        durationMs = stub.duration_ms;
      }
    } catch (err) {
      console.error("[prospect-dossier] sidecar failed, using stub", err);
      const stub = buildStubResponse(input, STUB_DURATION_MS, runId);
      filename = stub.output.filename;
      sizeBytes = stub.output.size_bytes;
      durationMs = stub.duration_ms;
      // Mark the run so we can tell stub vs real later; non-fatal.
      void supabase
        .from("skill_runs")
        .update({
          error: err instanceof SidecarError ? err.message : String(err),
        })
        .eq("id", runId);
    }
  } else {
    const stub = buildStubResponse(input, STUB_DURATION_MS, runId);
    filename = stub.output.filename;
    sizeBytes = stub.output.size_bytes;
    durationMs = stub.duration_ms;
  }

  if (docxBytes) {
    const { error: uploadErr } = await supabase.storage
      .from("dsg-outputs")
      .upload(storagePath, docxBytes, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });
    if (uploadErr) {
      console.error("[prospect-dossier] storage upload failed", uploadErr);
      docxBytes = null;
    }
  }

  const { data: outputRow } = await supabase
    .from("skill_outputs")
    .insert({
      user_id: user.id,
      skill_run_id: runId,
      storage_path: storagePath,
      filename,
      size_bytes: sizeBytes,
    })
    .select("id")
    .single();

  await supabase
    .from("skill_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      output_file_id: outputRow?.id ?? null,
      highlights,
    })
    .eq("id", runId);

  return NextResponse.json(
    {
      request_id: runId,
      status: "completed" as const,
      duration_ms: durationMs,
      output: {
        file_id: outputRow?.id ?? runId,
        filename,
        download_url: `/api/skills/prospect-dossier/download/${runId}`,
        size_bytes: sizeBytes,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      highlights,
    },
    { status: 200 }
  );
}
