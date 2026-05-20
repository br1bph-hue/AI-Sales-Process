"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SampleDossierModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-dsg-navy hover:underline"
      >
        View a sample
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sample Prospect Dossier</DialogTitle>
            <DialogDescription>
              What a finished dossier looks like. The design team will swap in
              a real screenshot later.
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-[8.5/11] rounded border border-dsg-gray-200 bg-white overflow-hidden">
            <div className="h-3 bg-dsg-red" />
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-dsg-navy uppercase tracking-widest">
                  Prospect Dossier
                </p>
                <p className="text-lg font-semibold text-dsg-gray-900 mt-1">
                  Crescent Electric Supply Company
                </p>
                <p className="text-xs text-dsg-gray-500 mt-0.5">
                  East Dubuque, IL · Electrical distribution · est. $1.5B
                </p>
              </div>
              <div className="border-l-2 border-dsg-navy pl-3">
                <p className="text-xs font-semibold text-dsg-navy">
                  Opening line
                </p>
                <p className="text-xs text-dsg-gray-700 mt-1">
                  Saw the new CFO appointment this quarter. Curious how that
                  shifts your specialty wire and cable strategy.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-dsg-gray-900">
                    Strongest signal
                  </p>
                  <p className="text-dsg-gray-700 mt-1">
                    New CFO appointed Q1 2026, prior tenure at Wesco.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-dsg-gray-900">Top pain</p>
                  <p className="text-dsg-gray-700 mt-1">
                    Sales comp misaligned with margin strategy.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-dsg-gray-900">Contacts</p>
                  <p className="text-dsg-gray-700 mt-1">
                    Three on the buying committee, two reachable.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-dsg-gray-900">
                    Prior touchpoints
                  </p>
                  <p className="text-dsg-gray-700 mt-1">
                    Two emails Q3 2024 (cold). One event meeting 2024.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
