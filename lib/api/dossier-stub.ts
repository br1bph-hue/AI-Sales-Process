import type {
  DossierCompletedResponse,
  DossierInput,
} from "@/lib/dossier-schema";

const STUB_DURATION_MS = 5000;

export function buildStubResponse(
  input: DossierInput,
  durationMs = STUB_DURATION_MS,
  requestId?: string
): DossierCompletedResponse {
  const id = requestId ?? cryptoUuid();
  const safe = input.company_name.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
  const filename = `Prospect_Dossier_${safe}_${dateStamp()}.docx`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    request_id: id,
    status: "completed",
    duration_ms: durationMs,
    output: {
      file_id: id,
      filename,
      download_url: `/api/skills/prospect-dossier/download/${id}`,
      size_bytes: 24816,
      expires_at: expires,
    },
    highlights: {
      company: input.company_name,
      strongest_signal: "New CFO appointed Q1 2026",
      top_pain: "Sales comp misaligned with margin strategy",
      prior_touchpoints_status: input.prior_interaction ? "yes" : "no",
      opening_line_preview:
        `Saw the recent leadership change at ${input.company_name}. Curious how`.slice(
          0,
          100
        ),
    },
  };
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function cryptoUuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
