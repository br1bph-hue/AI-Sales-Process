import type {
  DossierHighlights,
  DossierInput,
} from "@/lib/dossier-schema";

// Contract the Python FastAPI sidecar must satisfy. The sidecar is a
// separate service deployed at PYTHON_SERVICE_URL; this module is the
// single Next.js-side client.
//
// POST {PYTHON_SERVICE_URL}/skills/prospect-dossier
//   Headers:
//     Authorization: Bearer ${PYTHON_SERVICE_API_KEY}
//     Content-Type:  application/json
//   Body: SidecarDossierRequest
//   200:  SidecarDossierResponse
//   4xx/5xx with JSON { error: { code, message } } is treated as failure.

export interface SidecarDossierRequest {
  run_id: string;
  user_id: string;
  input: DossierInput;
}

export interface SidecarDossierResponse {
  status: "completed";
  duration_ms: number;
  filename: string;
  size_bytes: number;
  highlights: DossierHighlights;
  // Base64-encoded .docx bytes. We upload these to Supabase storage on
  // the Next.js side so the sidecar doesn't need storage credentials.
  docx_base64: string;
}

const SIDECAR_TIMEOUT_MS = 120_000;

export function sidecarConfigured(): boolean {
  return Boolean(process.env.PYTHON_SERVICE_URL);
}

export async function callDossierSidecar(
  req: SidecarDossierRequest
): Promise<SidecarDossierResponse | null> {
  const base = process.env.PYTHON_SERVICE_URL;
  if (!base) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SIDECAR_TIMEOUT_MS);
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/skills/prospect-dossier`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PYTHON_SERVICE_API_KEY
          ? { Authorization: `Bearer ${process.env.PYTHON_SERVICE_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(req),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new SidecarError(
        `sidecar ${res.status}: ${text.slice(0, 200)}`,
        res.status
      );
    }
    const json = (await res.json()) as SidecarDossierResponse;
    if (!json?.docx_base64 || !json.highlights) {
      throw new SidecarError("sidecar returned malformed response", 502);
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}

export class SidecarError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SidecarError";
    this.status = status;
  }
}
