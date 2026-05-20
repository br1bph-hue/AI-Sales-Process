"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { DOSSIER_PHASES } from "@/lib/skills";
import type {
  DossierCompletedResponse,
  DossierInput,
} from "@/lib/dossier-schema";
import { Check, Loader2 } from "lucide-react";

interface ProgressViewProps {
  input: DossierInput;
  jobId: string | null;
  pendingResponse: DossierCompletedResponse | null;
  onComplete: (response: DossierCompletedResponse) => void;
  onCancel: () => void;
}

interface LogLine {
  message: string;
  timestamp: Date;
  variant?: "info" | "warning";
}

const ANIMATION_MS = 5000;

export function ProgressView({
  input,
  jobId,
  pendingResponse,
  onComplete,
  onCancel,
}: ProgressViewProps) {
  const [activePhase, setActivePhase] = useState(0);
  const [animationDone, setAnimationDone] = useState(false);
  const [log, setLog] = useState<LogLine[]>([
    {
      message: `Starting Prospect Dossier for "${input.company_name}".`,
      timestamp: new Date(),
    },
  ]);
  const [timedOut, setTimedOut] = useState(false);
  const cancelledRef = useRef(false);
  const polledResponseRef = useRef<DossierCompletedResponse | null>(null);

  useEffect(() => {
    cancelledRef.current = false;
    const phaseDuration = ANIMATION_MS / DOSSIER_PHASES.length;

    const phaseTimers = DOSSIER_PHASES.map((label, index) =>
      window.setTimeout(() => {
        if (cancelledRef.current) return;
        setActivePhase(index);
        setLog((prev) => [
          ...prev,
          { message: label, timestamp: new Date() },
        ]);
      }, index * phaseDuration)
    );

    const doneTimer = window.setTimeout(() => {
      if (!cancelledRef.current) setAnimationDone(true);
    }, ANIMATION_MS);

    const timeoutTimer = window.setTimeout(() => {
      if (!cancelledRef.current) setTimedOut(true);
    }, 120_000);

    return () => {
      cancelledRef.current = true;
      phaseTimers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(doneTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, []);

  // Poll the job if we have a job ID instead of a sync response.
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const res = await fetch(`/api/skills/prospect-dossier/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "completed") {
          polledResponseRef.current = data;
          stopped = true;
          return;
        }
        if (data.status === "failed") {
          setLog((prev) => [
            ...prev,
            {
              message: "Generation failed. Returning to the form.",
              timestamp: new Date(),
              variant: "warning",
            },
          ]);
          stopped = true;
        }
      } catch {
        // swallow; retry next tick
      }
    };

    const loop = () => {
      if (stopped || cancelledRef.current) return;
      poll().finally(() => {
        if (!stopped && !cancelledRef.current) {
          timer = window.setTimeout(loop, 3000);
        }
      });
    };
    loop();

    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [jobId]);

  // When both the animation has run and the response is in, transition.
  useEffect(() => {
    if (!animationDone) return;
    const response = pendingResponse ?? polledResponseRef.current;
    if (response) {
      onComplete(response);
    }
  }, [animationDone, pendingResponse, onComplete]);

  async function handleCancel() {
    cancelledRef.current = true;
    if (jobId) {
      try {
        await fetch(`/api/skills/prospect-dossier/cancel/${jobId}`, {
          method: "POST",
        });
      } catch {
        // ignore
      }
    }
    onCancel();
  }

  const totalPhases = DOSSIER_PHASES.length;
  const percent = animationDone
    ? 100
    : Math.min(100, ((activePhase + 1) / totalPhases) * 100);

  return (
    <div className="dsg-card p-6 space-y-6">
      <div>
        <h2 className="dsg-section-header text-lg">
          Generating dossier for {input.company_name}
        </h2>
        <p className="text-sm text-dsg-gray-500 mt-1">
          Six phases. Don't navigate away. Or do; the job keeps running and
          you can pick it up in History.
        </p>
      </div>

      <div className="space-y-3">
        <Progress value={percent} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {DOSSIER_PHASES.map((label, i) => {
            const state =
              i < activePhase
                ? "done"
                : i === activePhase && !animationDone
                ? "running"
                : animationDone
                ? "done"
                : "pending";
            return (
              <div key={label} className="flex items-center gap-2">
                {state === "done" && (
                  <Check className="h-4 w-4 text-dsg-navy shrink-0" />
                )}
                {state === "running" && (
                  <Loader2 className="h-4 w-4 text-dsg-navy animate-spin shrink-0" />
                )}
                {state === "pending" && (
                  <span className="h-2 w-2 rounded-full bg-dsg-gray-300 ml-1 mr-1 shrink-0" />
                )}
                <span
                  className={
                    state === "pending"
                      ? "text-dsg-gray-500"
                      : "text-dsg-gray-900"
                  }
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-md bg-dsg-gray-50 border border-dsg-gray-200 max-h-48 overflow-auto">
        <ul className="divide-y divide-dsg-gray-200">
          {log.map((line, i) => (
            <li
              key={i}
              className="px-4 py-2 text-xs font-mono text-dsg-gray-700 flex gap-3"
            >
              <span className="text-dsg-gray-500 shrink-0">
                {line.timestamp.toLocaleTimeString("en-US", { hour12: false })}
              </span>
              <span
                className={
                  line.variant === "warning"
                    ? "text-dsg-red"
                    : "text-dsg-gray-700"
                }
              >
                {line.message}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {timedOut && (
        <div className="rounded-md border border-dsg-navy/30 bg-dsg-navy/5 p-4 text-sm text-dsg-gray-700">
          Generation took longer than expected. We'll keep working on it. You
          can leave this page and return to History to check status.
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-dsg-gray-500 hover:text-dsg-gray-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
