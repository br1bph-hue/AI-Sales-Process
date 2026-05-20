"use client";

import { useEffect, useState } from "react";
import type {
  DossierHighlights,
  DossierInput,
} from "@/lib/dossier-schema";

interface DocxPreviewProps {
  fileUrl: string;
  filename: string;
  highlights: DossierHighlights;
  input: DossierInput;
}

export function DocxPreview({
  fileUrl,
  filename,
  highlights,
  input,
}: DocxPreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
          throw new Error("Preview unavailable");
        }
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("officedocument")) {
          throw new Error("Placeholder file");
        }
        const arrayBuffer = await res.arrayBuffer();
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error && e.message === "Placeholder file"
              ? "placeholder"
              : "error"
          );
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (html) {
    return (
      <div
        className="prose prose-sm max-w-none text-dsg-gray-900"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="rounded border border-dsg-gray-200 bg-white p-6">
      {error === "placeholder" && (
        <p className="text-xs text-dsg-gray-500 mb-4">
          Preview will render the real .docx once the Python service is wired
          up. Below is a structured preview built from highlights.
        </p>
      )}
      <article className="space-y-4 text-sm text-dsg-gray-900">
        <header className="border-b border-dsg-gray-200 pb-3">
          <p className="text-xs uppercase tracking-widest text-dsg-navy">
            Prospect Dossier
          </p>
          <h4 className="text-lg font-semibold mt-1">{highlights.company}</h4>
          <p className="text-xs text-dsg-gray-500 mt-1">{filename}</p>
        </header>

        <section>
          <h5 className="dsg-section-header text-sm">Opening line</h5>
          <p className="mt-1 text-dsg-gray-700">
            {highlights.opening_line_preview}...
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h5 className="dsg-section-header text-sm">Strongest signal</h5>
            <p className="mt-1 text-dsg-gray-700">{highlights.strongest_signal}</p>
          </div>
          <div>
            <h5 className="dsg-section-header text-sm">Top pain</h5>
            <p className="mt-1 text-dsg-gray-700">{highlights.top_pain}</p>
          </div>
        </section>

        {input.meeting_context && (
          <section>
            <h5 className="dsg-section-header text-sm">Meeting context</h5>
            <p className="mt-1 text-dsg-gray-700">{input.meeting_context}</p>
          </section>
        )}

        {input.product_line && (
          <section>
            <h5 className="dsg-section-header text-sm">Product line</h5>
            <p className="mt-1 text-dsg-gray-700">{input.product_line}</p>
          </section>
        )}
      </article>
    </div>
  );
}
