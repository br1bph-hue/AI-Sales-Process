import { NextRequest, NextResponse } from "next/server";
import { apiError, requireUser } from "@/lib/api/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { job_id: string } }
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { user, supabase } = auth;

  const { data: run, error } = await supabase
    .from("skill_runs")
    .select("id, status")
    .eq("id", params.job_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !run) {
    return apiError("not_found", "Job not found.", 404);
  }

  if (run.status === "completed" || run.status === "failed") {
    return NextResponse.json({ status: run.status });
  }

  await supabase
    .from("skill_runs")
    .update({ status: "canceled", completed_at: new Date().toISOString() })
    .eq("id", run.id);

  return NextResponse.json({ status: "canceled" });
}
