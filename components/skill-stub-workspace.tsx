"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { SkillStubMeta, SkillStubResponse } from "@/lib/skill-stubs";

interface Props {
  skill: SkillStubMeta;
}

export function SkillStubWorkspace({ skill }: Props) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SkillStubResponse | null>(null);
  const { toast } = useToast();

  async function submit() {
    if (prompt.trim().length < 2) {
      toast({
        title: "Add some context first",
        description: "A sentence or two is enough to get a draft.",
      });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/skills/${skill.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Couldn't generate",
          description: json?.error?.message ?? "Unknown error.",
          variant: "destructive",
        });
        return;
      }
      setResult(json as SkillStubResponse);
    } catch (err) {
      toast({
        title: "Network error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="dsg-card p-6">
        <h2 className="text-lg font-semibold text-dsg-gray-900">Input</h2>
        <p className="mt-1 text-sm text-dsg-gray-500">
          This skill is wired to a stub response while the real backend is
          built. The shape of the output is real; the content is placeholder.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="prompt">{skill.inputLabel}</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={skill.inputPlaceholder}
            rows={8}
            disabled={busy}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={submit} disabled={busy} size="lg">
            {busy ? "Generating…" : "Generate"}
          </Button>
        </div>
      </div>

      <div className="dsg-card p-6">
        <h2 className="text-lg font-semibold text-dsg-gray-900">
          {skill.outputTitle}
        </h2>
        {!result && (
          <p className="mt-2 text-sm text-dsg-gray-500">
            Submit some context on the left to see a draft.
          </p>
        )}
        {result && (
          <div className="mt-4 space-y-4">
            {result.sections.map((s) => (
              <section key={s.heading}>
                <h3 className="text-sm font-semibold text-dsg-navy">
                  {s.heading}
                </h3>
                <p className="mt-1 text-sm text-dsg-gray-700">{s.body}</p>
              </section>
            ))}
            <p className="pt-2 text-xs text-dsg-gray-500">
              Generated in {Math.round(result.duration_ms / 100) / 10}s ·
              request {result.request_id.slice(0, 8)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
