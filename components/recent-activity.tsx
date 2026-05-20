"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Download, RotateCcw } from "lucide-react";

interface RecentRun {
  id: string;
  inputs: { company_name?: string } | null;
  status: string;
  created_at: string;
  output_file_id: string | null;
  skill_outputs?:
    | { filename: string; storage_path: string }
    | { filename: string; storage_path: string }[]
    | null;
}

interface RecentActivityProps {
  runs: RecentRun[];
}

function getOutput(
  out: RecentRun["skill_outputs"]
): { filename: string; storage_path: string } | null {
  if (!out) return null;
  if (Array.isArray(out)) return out[0] ?? null;
  return out;
}

export function RecentActivity({ runs }: RecentActivityProps) {
  const router = useRouter();

  if (!runs.length) {
    return (
      <div className="dsg-card p-8 text-center">
        <p className="text-sm text-dsg-gray-700">
          You haven't generated any dossiers yet. Start with the company you're
          calling first this week.
        </p>
        <Button asChild className="mt-4" size="default">
          <Link href="/skills/prospect-dossier">Open Prospect Dossier</Link>
        </Button>
      </div>
    );
  }

  function handleRegenerate(run: RecentRun) {
    const company = run.inputs?.company_name || "";
    const url = `/skills/prospect-dossier?company_name=${encodeURIComponent(company)}`;
    router.push(url);
  }

  return (
    <div className="dsg-card overflow-hidden">
      <ul className="divide-y divide-dsg-gray-200">
        {runs.map((run) => {
          const output = getOutput(run.skill_outputs);
          return (
            <li
              key={run.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-dsg-gray-900 truncate">
                  {run.inputs?.company_name || "Untitled run"}
                </p>
                <p className="text-xs text-dsg-gray-500 mt-0.5">
                  {formatDate(run.created_at)}
                  <span className="mx-2">·</span>
                  {run.status === "completed" ? "Completed" : run.status}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {output && (
                  <Button asChild variant="secondary" size="sm">
                    <a
                      href={`/api/skills/prospect-dossier/download/${run.id}`}
                    >
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
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
