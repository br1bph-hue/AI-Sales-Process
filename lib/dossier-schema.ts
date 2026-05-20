import { z } from "zod";

export const dossierInputSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters.")
    .max(100, "Company name can't exceed 100 characters.")
    .regex(/[A-Za-z]/, "Company name must contain at least one letter."),
  meeting_context: z
    .string()
    .max(500, "Keep meeting context under 500 characters.")
    .optional()
    .default(""),
  product_line: z
    .string()
    .max(200, "Keep product line under 200 characters.")
    .optional()
    .default(""),
  prior_interaction: z
    .string()
    .max(500, "Keep prior interaction under 500 characters.")
    .optional()
    .default(""),
  crm_provider: z.string().optional(),
  email_provider: z.string().optional(),
  options: z
    .object({
      output_format: z.enum(["docx"]).default("docx"),
      interrupt_on_name_collision: z.boolean().default(true),
      disambiguated_company: z.string().optional(),
    })
    .optional()
    .default({ output_format: "docx", interrupt_on_name_collision: true }),
});

export type DossierInput = z.infer<typeof dossierInputSchema>;

export interface DossierHighlights {
  company: string;
  strongest_signal: string;
  top_pain: string;
  prior_touchpoints_status: "yes" | "no";
  opening_line_preview: string;
}

export interface DossierOutput {
  file_id: string;
  filename: string;
  download_url: string;
  size_bytes: number;
  expires_at: string;
}

export interface DossierCompletedResponse {
  request_id: string;
  status: "completed";
  duration_ms: number;
  output: DossierOutput;
  highlights: DossierHighlights;
}

export interface DossierRunningResponse {
  request_id: string;
  status: "running";
  job_id: string;
  poll_url: string;
}

export type DossierApiResponse =
  | DossierCompletedResponse
  | DossierRunningResponse;
