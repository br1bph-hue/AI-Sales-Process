"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Download, RotateCcw, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface HistoryRun {
  id: string;
  inputs: { company_name?: string } | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  output_file_id: string | null;
  skill_outputs?:
    | { id: string; filename: string; expires_at: string }
    | { id: string; filename: string; expires_at: string }[]
    | null;
}

interface HistoryTableProps {
  runs: HistoryRun[];
}

function getOutput(
  out: HistoryRun["skill_outputs"]
): { id: string; filename: string; expires_at: string } | null {
  if (!out) return null;
  if (Array.isArray(out)) return out[0] ?? null;
  return out;
}

function statusLabel(run: HistoryRun): { label: string; tone: string } {
  if (run.status === "completed") {
    const output = getOutput(run.skill_outputs);
    if (output && new Date(output.expires_at) < new Date()) {
      return { label: "Expired", tone: "text-dsg-gray-500" };
    }
    return { label: "Completed", tone: "text-dsg-navy" };
  }
  if (run.status === "failed") return { label: "Failed", tone: "text-dsg-red" };
  if (run.status === "canceled") return { label: "Canceled", tone: "text-dsg-gray-500" };
  return { label: "Running", tone: "text-dsg-gray-700" };
}

export function HistoryTable({ runs }: HistoryTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(run: HistoryRun) {
    if (!confirm(`Delete the dossier for ${run.inputs?.company_name ?? "this run"}?`)) {
      return;
    }
    setDeletingId(run.id);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("skill_runs").delete().eq("id", run.id);
    setDeletingId(null);
    if (error) {
      toast({
        variant: "destructive",
        title: "Couldn't delete",
        description: error.message,
      });
      return;
    }
    router.refresh();
  }

  function handleRegenerate(run: HistoryRun) {
    const company = run.inputs?.company_name ?? "";
    router.push(
      `/skills/prospect-dossier?company_name=${encodeURIComponent(company)}`
    );
  }

  return (
    <div className="dsg-card overflow-hidden">
      <div className="hidden md:grid grid-cols-[1fr_180px_120px_280px] gap-4 px-5 py-3 border-b border-dsg-gray-200 bg-dsg-gray-50 text-xs uppercase tracking-wider text-dsg-gray-500">
        <span>Company</span>
        <span>Date</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="divide-y divide-dsg-gray-200">
        {runs.map((run) => {
          const status = statusLabel(run);
          const output = getOutput(run.skill_outputs);
          const downloadable =
            run.status === "completed" && output && new Date(output.expires_at) > new Date();
          return (
            <li
              key={run.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_180px_120px_280px] gap-2 md:gap-4 px-5 py-4 items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-dsg-gray-900 truncate">
                  {run.inputs?.company_name || "Untitled run"}
                </p>
                <p className="text-xs text-dsg-gray-500 mt-0.5 md:hidden">
                  {formatDate(run.created_at)} ·{" "}
                  <span className={status.tone}>{status.label}</span>
                </p>
              </div>
              <p className="hidden md:block text-sm text-dsg-gray-700">
                {formatDate(run.created_at)}
              </p>
              <p className={`hidden md:block text-sm ${status.tone}`}>
                {status.label}
              </p>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {downloadable && (
                  <Button asChild variant="secondary" size="sm">
                    <a href={`/api/skills/prospect-dossier/download/${run.id}`}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRegenerate(run)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(run)}
                  disabled={deletingId === run.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
