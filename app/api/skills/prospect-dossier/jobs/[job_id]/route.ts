import { NextRequest, NextResponse } from "next/server";
import { apiError, requireUser } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { job_id: string } }
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { user, supabase } = auth;

  const { data: run, error } = await supabase
    .from("skill_runs")
    .select(
      "id, status, duration_ms, completed_at, highlights, output_file_id, inputs, skill_outputs(id, filename, size_bytes, expires_at)"
    )
    .eq("id", params.job_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !run) {
    return apiError("not_found", "Job not found.", 404);
  }

  if (run.status !== "completed") {
    return NextResponse.json({
      request_id: run.id,
      status: run.status,
      job_id: run.id,
      poll_url: `/api/skills/prospect-dossier/jobs/${run.id}`,
    });
  }

  const output = Array.isArray(run.skill_outputs)
    ? run.skill_outputs[0]
    : run.skill_outputs;

  return NextResponse.json({
    request_id: run.id,
    status: "completed",
    duration_ms: run.duration_ms ?? 0,
    output: {
      file_id: output?.id ?? run.id,
      filename: output?.filename ?? `Prospect_Dossier_${run.id}.docx`,
      download_url: `/api/skills/prospect-dossier/download/${run.id}`,
      size_bytes: output?.size_bytes ?? 0,
      expires_at:
        output?.expires_at ??
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    highlights: run.highlights,
  });
}
