import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, requireUser } from "@/lib/api/auth";
import { buildSkillStubResponse, SKILL_STUBS } from "@/lib/skill-stubs";

const inputSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(2, "Please add some context (at least 2 characters).")
    .max(2000, "Keep input under 2000 characters."),
});

const RATE_LIMIT_PER_HOUR = 20;
const STUB_DURATION_MS = 2500;

export function makeStubSkillRoute(skillId: string) {
  return async function POST(request: NextRequest) {
    if (!SKILL_STUBS[skillId]) {
      return apiError("unknown_skill", `Unknown skill: ${skillId}`, 404);
    }

    const auth = await requireUser();
    if (auth.response) return auth.response;
    const { user, supabase } = auth;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("invalid_json", "Request body must be JSON.", 400);
    }

    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "invalid_input",
        parsed.error.issues[0]?.message ?? "Bad input.",
        400
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("skill_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("skill", skillId)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return apiError(
        "rate_limited",
        `You've hit the hourly limit (${RATE_LIMIT_PER_HOUR} per hour).`,
        429
      );
    }

    const startedAt = new Date().toISOString();
    const { data: runRow } = await supabase
      .from("skill_runs")
      .insert({
        user_id: user.id,
        skill: skillId,
        version: "0.1",
        inputs: parsed.data,
        status: "running",
        started_at: startedAt,
      })
      .select("id")
      .single();

    const stub = buildSkillStubResponse(
      skillId,
      runRow?.id as string | undefined,
      STUB_DURATION_MS
    )!;

    if (runRow) {
      await supabase
        .from("skill_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          duration_ms: STUB_DURATION_MS,
          highlights: stub,
        })
        .eq("id", runRow.id);
    }

    return NextResponse.json(stub, { status: 200 });
  };
}
