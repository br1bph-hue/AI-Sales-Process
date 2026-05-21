import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { buildPlaceholderDocx } from "@/lib/api/docx-placeholder";
import { dossierInputSchema } from "@/lib/dossier-schema";
import { buildStubResponse } from "@/lib/api/dossier-stub";

export async function GET(
  _request: NextRequest,
  { params }: { params: { run_id: string } }
) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { user, supabase } = auth;

  const { data: run } = await supabase
    .from("skill_runs")
    .select("id, inputs, highlights, skill_outputs(storage_path, filename)")
    .eq("id", params.run_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const output = Array.isArray(run?.skill_outputs)
    ? run?.skill_outputs?.[0]
    : run?.skill_outputs;

  if (output?.storage_path) {
    const { data: signed } = await supabase.storage
      .from("dsg-outputs")
      .createSignedUrl(output.storage_path, 60 * 60 * 24);
    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl);
    }
  }

  // v1 stub fallback: synthesize a minimal valid .docx from saved inputs
  // and highlights so the in-browser preview and download both work.
  const inputParsed = run?.inputs
    ? dossierInputSchema.safeParse(run.inputs)
    : null;
  const input =
    inputParsed?.success
      ? inputParsed.data
      : dossierInputSchema.parse({
          company_name: "Sample Company",
          meeting_context: "",
          product_line: "",
          prior_interaction: "",
        });
  const highlights =
    (run?.highlights as ReturnType<typeof buildStubResponse>["highlights"]) ||
    buildStubResponse(input).highlights;

  const docx = buildPlaceholderDocx(input, highlights);
  const filename =
    output?.filename ?? `Prospect_Dossier_${params.run_id}.docx`;

  const body = new Uint8Array(docx);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.length),
    },
  });
}

export const dynamic = "force-dynamic";
