"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { ProspectDossierForm } from "./form";
import { ProgressView } from "./progress-view";
import { OutputView } from "./output-view";
import { SamplePreviewCard } from "./sample-preview";
import { NameCollisionModal } from "./name-collision-modal";
import { relativeMinutes } from "@/lib/utils";
import type {
  DossierCompletedResponse,
  DossierInput,
} from "@/lib/dossier-schema";

type ViewState = "form" | "progress" | "output";

interface ConnectionState {
  provider: string;
  status: string;
}

interface WorkspaceProps {
  crmConnection: ConnectionState | null;
  emailConnection: ConnectionState | null;
}

export interface CompanyCandidate {
  name: string;
  hq_city?: string;
  revenue_estimate?: string;
  segment?: string;
}

interface SubmitResult {
  kind: "completed" | "running" | "error";
  response?: DossierCompletedResponse;
  jobId?: string;
}

export function ProspectDossierWorkspace({
  crmConnection,
  emailConnection,
}: WorkspaceProps) {
  const params = useSearchParams();
  const presetCompany = params.get("company_name") || "";

  const [view, setView] = useState<ViewState>("form");
  const [savedInput, setSavedInput] = useState<DossierInput | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<DossierCompletedResponse | null>(null);
  const [pendingResponse, setPendingResponse] = useState<DossierCompletedResponse | null>(null);
  const [collisionCandidates, setCollisionCandidates] = useState<
    CompanyCandidate[] | null
  >(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null);

  const submitToApi = useCallback(
    async (input: DossierInput): Promise<SubmitResult> => {
      try {
        const res = await fetch("/api/skills/prospect-dossier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (res.status === 409) {
          const body = await res.json();
          setCollisionCandidates(body?.error?.candidates ?? []);
          return { kind: "error" };
        }
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          const retryAt = body?.error?.retry_at
            ? new Date(body.error.retry_at)
            : new Date(Date.now() + 60 * 60 * 1000);
          setRateLimitedUntil(retryAt);
          const mins = relativeMinutes(retryAt);
          toast({
            variant: "destructive",
            title: "Hourly limit hit",
            description: `You've hit the hourly limit (10 dossiers per hour). Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
          });
          return { kind: "error" };
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toast({
            variant: "destructive",
            title: "Couldn't start the dossier",
            description: body?.error?.message || "Something went wrong.",
          });
          return { kind: "error" };
        }
        const data = await res.json();
        if (data.status === "completed") {
          return { kind: "completed", response: data };
        }
        if (data.status === "running") {
          return { kind: "running", jobId: data.job_id };
        }
        return { kind: "error" };
      } catch {
        toast({
          variant: "destructive",
          title: "Connection lost",
          description:
            "Your input is saved. Click Generate when you're back online.",
        });
        return { kind: "error" };
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (input: DossierInput) => {
      setSavedInput(input);
      setCompleted(null);
      setPendingResponse(null);
      setJobId(null);
      setView("progress");

      const result = await submitToApi(input);
      if (result.kind === "completed" && result.response) {
        setPendingResponse(result.response);
      } else if (result.kind === "running" && result.jobId) {
        setJobId(result.jobId);
      } else {
        setView("form");
      }
    },
    [submitToApi]
  );

  const handleProgressComplete = useCallback(
    (response: DossierCompletedResponse) => {
      setCompleted(response);
      setView("output");
    },
    []
  );

  const handleCancel = useCallback(() => {
    setJobId(null);
    setPendingResponse(null);
    setView("form");
  }, []);

  const handleRegenerate = useCallback(() => {
    setCompleted(null);
    setJobId(null);
    setPendingResponse(null);
    setView("form");
  }, []);

  const handleCollisionPick = useCallback(
    async (picked: CompanyCandidate) => {
      setCollisionCandidates(null);
      if (!savedInput) return;
      const resolved: DossierInput = {
        ...savedInput,
        company_name: picked.name,
        options: {
          ...(savedInput.options ?? {
            output_format: "docx",
            interrupt_on_name_collision: false,
          }),
          interrupt_on_name_collision: false,
          disambiguated_company: picked.name,
        },
      };
      await handleSubmit(resolved);
    },
    [savedInput, handleSubmit]
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {view === "form" && (
            <ProspectDossierForm
              presetCompany={presetCompany}
              initialValues={savedInput}
              crmConnection={crmConnection}
              emailConnection={emailConnection}
              rateLimitedUntil={rateLimitedUntil}
              onSubmit={handleSubmit}
            />
          )}
          {view === "progress" && savedInput && (
            <ProgressView
              input={savedInput}
              jobId={jobId}
              pendingResponse={pendingResponse}
              onComplete={handleProgressComplete}
              onCancel={handleCancel}
            />
          )}
          {view === "output" && completed && savedInput && (
            <OutputView
              input={savedInput}
              response={completed}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          <SamplePreviewCard />
        </div>
      </div>

      <NameCollisionModal
        candidates={collisionCandidates}
        onClose={() => setCollisionCandidates(null)}
        onPick={handleCollisionPick}
      />
    </>
  );
}
