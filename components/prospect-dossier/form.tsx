"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  dossierInputSchema,
  type DossierInput,
} from "@/lib/dossier-schema";
import { SampleDossierModal } from "./sample-modal";
import { Check, CircleAlert } from "lucide-react";
import Link from "next/link";
import { relativeMinutes } from "@/lib/utils";

interface ConnectionState {
  provider: string;
  status: string;
}

interface ProspectDossierFormProps {
  presetCompany: string;
  initialValues: DossierInput | null;
  crmConnection: ConnectionState | null;
  emailConnection: ConnectionState | null;
  rateLimitedUntil: Date | null;
  onSubmit: (input: DossierInput) => void | Promise<void>;
}

interface FormState {
  company_name: string;
  meeting_context: string;
  product_line: string;
  prior_interaction: string;
}

const DEFAULT_FORM: FormState = {
  company_name: "",
  meeting_context: "",
  product_line: "",
  prior_interaction: "",
};

function isCompanyValid(v: string): boolean {
  const trimmed = v.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && /[A-Za-z]/.test(trimmed);
}

export function ProspectDossierForm({
  presetCompany,
  initialValues,
  crmConnection,
  emailConnection,
  rateLimitedUntil,
  onSubmit,
}: ProspectDossierFormProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (initialValues) {
      return {
        company_name: initialValues.company_name,
        meeting_context: initialValues.meeting_context || "",
        product_line: initialValues.product_line || "",
        prior_interaction: initialValues.prior_interaction || "",
      };
    }
    return { ...DEFAULT_FORM, company_name: presetCompany };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const generateDisabled = useMemo(() => {
    if (!isCompanyValid(form.company_name)) return true;
    if (rateLimitedUntil && rateLimitedUntil > new Date()) return true;
    return false;
  }, [form.company_name, rateLimitedUntil]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setErrors({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = dossierInputSchema.safeParse({
      company_name: form.company_name,
      meeting_context: form.meeting_context,
      product_line: form.product_line,
      prior_interaction: form.prior_interaction,
      crm_provider:
        crmConnection?.status === "connected" ? crmConnection.provider : undefined,
      email_provider:
        emailConnection?.status === "connected" ? emailConnection.provider : undefined,
      options: { output_format: "docx", interrupt_on_name_collision: true },
    });

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    onSubmit(parsed.data);
  }

  const cooldownMinutes =
    rateLimitedUntil && rateLimitedUntil > new Date()
      ? relativeMinutes(rateLimitedUntil)
      : 0;

  return (
    <div className="dsg-card">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="company_name">
            Company name <span className="text-dsg-red">*</span>
          </Label>
          <Input
            id="company_name"
            required
            maxLength={100}
            placeholder="Crescent Electric Supply Company"
            value={form.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            aria-invalid={!!errors.company_name}
          />
          {errors.company_name && (
            <p className="text-xs text-dsg-red flex items-center gap-1">
              <CircleAlert className="h-3 w-3" /> {errors.company_name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="meeting_context">Meeting context</Label>
          <Textarea
            id="meeting_context"
            rows={3}
            maxLength={500}
            placeholder="Discovery call tomorrow with their VP of Purchasing. Positioning specialty wire and cable."
            value={form.meeting_context}
            onChange={(e) => update("meeting_context", e.target.value)}
          />
          <div className="flex justify-between text-xs text-dsg-gray-500">
            <span>{errors.meeting_context ?? "Optional."}</span>
            <span>{form.meeting_context.length} / 500</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product_line">Product line</Label>
          <Input
            id="product_line"
            maxLength={200}
            placeholder="Specialty wire and cable"
            value={form.product_line}
            onChange={(e) => update("product_line", e.target.value)}
          />
          {errors.product_line && (
            <p className="text-xs text-dsg-red">{errors.product_line}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="prior_interaction">Prior interaction</Label>
          <Textarea
            id="prior_interaction"
            rows={3}
            maxLength={500}
            placeholder="Met their previous COO at a NAED event in 2024. He's since moved on."
            value={form.prior_interaction}
            onChange={(e) => update("prior_interaction", e.target.value)}
          />
          <div className="flex justify-between text-xs text-dsg-gray-500">
            <span>{errors.prior_interaction ?? "Optional."}</span>
            <span>{form.prior_interaction.length} / 500</span>
          </div>
        </div>

        <ConnectionIndicators
          crm={crmConnection}
          email={emailConnection}
        />

        <div className="pt-2">
          <Button type="submit" block size="xl" disabled={generateDisabled}>
            Generate Dossier
          </Button>
          {cooldownMinutes > 0 && (
            <p className="mt-2 text-xs text-dsg-red">
              Hourly limit hit. Try again in {cooldownMinutes} minute
              {cooldownMinutes === 1 ? "" : "s"}.
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <SampleDossierModal />
            <button
              type="button"
              className="text-sm text-dsg-gray-500 hover:text-dsg-gray-900"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ConnectionIndicators({
  crm,
  email,
}: {
  crm: ConnectionState | null;
  email: ConnectionState | null;
}) {
  const crmLabel =
    crm?.status === "connected"
      ? `CRM: ${prettyProvider(crm.provider)} connected`
      : "CRM: Not connected";
  const emailLabel =
    email?.status === "connected"
      ? `Email: ${prettyProvider(email.provider)} connected`
      : "Email: Not connected";

  return (
    <div className="border-t border-dsg-gray-200 pt-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-dsg-gray-700">
          {crm?.status === "connected" ? (
            <Check className="h-3.5 w-3.5 text-dsg-navy" />
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-dsg-gray-300" />
          )}
          {crmLabel}
        </span>
        {crm?.status !== "connected" && (
          <Link href="/settings" className="text-dsg-navy hover:underline text-xs">
            Connect
          </Link>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-dsg-gray-700">
          {email?.status === "connected" ? (
            <Check className="h-3.5 w-3.5 text-dsg-navy" />
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-dsg-gray-300" />
          )}
          {emailLabel}
        </span>
        {email?.status !== "connected" && (
          <Link href="/settings" className="text-dsg-navy hover:underline text-xs">
            Connect
          </Link>
        )}
      </div>
    </div>
  );
}

function prettyProvider(p: string): string {
  return (
    {
      hubspot: "HubSpot",
      salesforce: "Salesforce",
      close: "Close",
      pipedrive: "Pipedrive",
      outlook: "Outlook",
      gmail: "Gmail",
    } as Record<string, string>
  )[p] || p;
}
