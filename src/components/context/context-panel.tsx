"use client";

import { Dialog } from "@/components/ui/dialog";
import { formatEnergy, formatPower } from "@/lib/format";
import type { Derived } from "@/lib/engine/model";
import type { CampusContext } from "@/types/energy";
import { useState } from "react";

export function ContextPanel({ derived, context }: { derived: Derived; context: CampusContext }) {
  const [open, setOpen] = useState(false);
  const normal = context.deviationLabel ? true : Math.abs(derived.deviationPct) < 12 || context.registrationPeriod || context.highOccupancyEvent;
  return (
    <div className="flex h-full flex-col justify-between gap-4 p-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Context</p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500">Expected</p>
            <p className="num text-xl">{formatEnergy(derived.expectedKwh)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Actual</p>
            <p className="num text-xl">{formatEnergy(derived.actualKwh)}</p>
          </div>
        </div>
        <p className={`mt-3 text-sm ${normal ? "text-emerald-500" : "text-amber-500"}`}>{normal ? "Normal" : "Review"} · {derived.statusLabel}</p>
        <p className="mt-2 text-xs text-zinc-500">Live demand {formatPower(derived.campusPowerKw)} against an expected {formatPower(derived.expectedPowerKw)} for this hour.</p>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-sm text-violet-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
        Explain
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Why this reading is in context">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          The platform compares actual use with a context-adjusted expectation. A high reading is not an anomaly when occupancy, the academic calendar, weather, and the timetable already account for it.
        </p>
        <ul className="mt-4 space-y-2">
          {derived.contextFactors.map((factor) => (
            <li key={factor.label} className="flex items-center justify-between gap-4 border-t border-zinc-200 py-2 text-sm dark:border-zinc-800">
              <span className="text-zinc-500">{factor.label}</span>
              <span>{factor.detail}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">Status: {normal ? "Normal" : "Needs review"}. {derived.statusLabel}.</p>
      </Dialog>
    </div>
  );
}
