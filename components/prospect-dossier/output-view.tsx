"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";
import type {
  DossierCompletedResponse,
  DossierInput,
} from "@/lib/dossier-schema";
import { DocxPreview } from "./docx-preview";
import { Download, Mail, Link as LinkIcon, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface OutputViewProps {
  input: DossierInput;
  response: DossierCompletedResponse;
  onRegenerate: () => void;
}

export function OutputView({ input, response, onRegenerate }: OutputViewProps) {
  const [previewOpen, setPreviewOpen] = useState(true);

  async function handleShare() {
    try {
      const fakeUrl = `${window.location.origin}${response.output.download_url}`;
      await navigator.clipboard.writeText(fakeUrl);
      toast({
        title: "Link copied",
        description: "A signed link is on your clipboard. It expires in 24 hours.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
      });
    }
  }

  function handleEmailSelf() {
    toast({
      title: "Coming soon",
      description: "Email-to-self ships in v1.1.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="dsg-card p-6">
        <p className="text-xs uppercase tracking-widest text-dsg-navy">Done</p>
        <h2 className="mt-1 text-2xl font-semibold text-dsg-gray-900 tracking-tight">
          {response.highlights.company}
        </h2>
        <p className="text-xs text-dsg-gray-500 mt-1">
          Generated {formatDateTime(new Date())} ·{" "}
          {(response.duration_ms / 1000).toFixed(1)} seconds
        </p>

        <div className="mt-5">
          <Button asChild block size="xl">
            <a
              href={response.output.download_url}
              download={response.output.filename}
            >
              <Download className="h-4 w-4" />
              Download .docx
            </a>
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 text-dsg-navy hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleEmailSelf}
            className="inline-flex items-center gap-1.5 text-dsg-navy hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            Email to myself
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-dsg-navy hover:underline"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Share via link
          </button>
        </div>
      </div>

      <div className="dsg-card">
        <div className="px-6 py-4 border-b border-dsg-gray-200">
          <h3 className="dsg-section-header text-base">Highlights</h3>
        </div>
        <dl className="divide-y divide-dsg-gray-200">
          <HighlightRow label="Company" value={response.highlights.company} />
          <HighlightRow
            label="Strongest signal"
            value={response.highlights.strongest_signal}
          />
          <HighlightRow
            label="Top pain"
            value={response.highlights.top_pain}
          />
          <HighlightRow
            label="Prior touchpoints"
            value={
              response.highlights.prior_touchpoints_status === "yes" ? "Yes" : "No"
            }
          />
          <HighlightRow
            label="Opening line"
            value={response.highlights.opening_line_preview}
          />
        </dl>
      </div>

      <div className="dsg-card">
        <button
          type="button"
          onClick={() => setPreviewOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 border-b border-dsg-gray-200 text-left"
          aria-expanded={previewOpen}
        >
          <h3 className="dsg-section-header text-base">Document preview</h3>
          {previewOpen ? (
            <ChevronUp className="h-4 w-4 text-dsg-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-dsg-gray-500" />
          )}
        </button>
        {previewOpen && (
          <div className="p-6">
            <DocxPreview
              fileUrl={response.output.download_url}
              filename={response.output.filename}
              highlights={response.highlights}
              input={input}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function HighlightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-6 py-3 text-sm">
      <dt className="text-dsg-gray-500">{label}</dt>
      <dd className="text-dsg-gray-900">{value}</dd>
    </div>
  );
}
