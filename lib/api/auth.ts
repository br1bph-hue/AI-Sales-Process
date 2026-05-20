import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      user: null,
      supabase,
      response: NextResponse.json(
        { error: { code: "unauthorized", message: "Sign in to continue." } },
        { status: 401 }
      ),
    } as const;
  }
  return { user, supabase, response: null } as const;
}

export function apiError(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: { code, message, ...(extra ?? {}) } },
    { status }
  );
}
