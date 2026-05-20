"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CompanyCandidate } from "./workspace";

interface NameCollisionModalProps {
  candidates: CompanyCandidate[] | null;
  onClose: () => void;
  onPick: (candidate: CompanyCandidate) => void;
}

export function NameCollisionModal({
  candidates,
  onClose,
  onPick,
}: NameCollisionModalProps) {
  const open = !!candidates && candidates.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Which company did you mean?</DialogTitle>
          <DialogDescription>
            Multiple companies match this name. Pick one to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {candidates?.map((c) => (
            <button
              key={`${c.name}-${c.hq_city ?? ""}`}
              type="button"
              onClick={() => onPick(c)}
              className="w-full text-left rounded-md border border-dsg-gray-200 hover:border-dsg-navy hover:bg-dsg-gray-50 p-4 transition-colors"
            >
              <p className="font-medium text-dsg-gray-900">{c.name}</p>
              <p className="text-xs text-dsg-gray-500 mt-1">
                {[c.hq_city, c.revenue_estimate, c.segment]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
