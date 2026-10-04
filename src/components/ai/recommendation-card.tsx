"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnergyStore } from "@/lib/engine/store";
import { formatMoney, formatPower } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InsightView } from "@/lib/engine/views";
import { useEffect, useRef, useState } from "react";

export function RecommendationCard({ insight, onApply }: { insight: InsightView; onApply: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const highlight = useEnergyStore((state) => state.highlight);
  const storyIndex = useEnergyStore((state) => state.storyIndex);
  const story = useEnergyStore((state) => state.campus.demoStory);
  const focused = highlight === `insight-${insight.id}`;
  const stepId = focused ? story[storyIndex]?.id : undefined;
  const revealSavings = stepId !== "detect" && stepId !== "explain";
  const previousStep = useRef(stepId);

  useEffect(() => {
    if (stepId === "explain") setOpen(true);
    else if (previousStep.current === "explain") setOpen(false);
    previousStep.current = stepId;
  }, [stepId]);

  return (
    <article id={`insight-${insight.id}`} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-500">AI advisor</p>
          <h3 className="mt-1 text-base font-medium">{insight.title}</h3>
          <p className="text-sm text-zinc-500">{insight.location}</p>
        </div>
        <Badge tone="violet">{insight.confidence}% confidence</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{insight.what}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {insight.occupancy !== null ? <Stat label="Occupancy" value={`${insight.occupancy} people`} /> : null}
        {insight.currentPowerKw !== null ? <Stat label="Current power" value={formatPower(insight.currentPowerKw)} /> : null}
        {insight.wasteKw !== null ? <Stat label="Estimated waste" value={formatPower(insight.wasteKw)} /> : null}
      </dl>
      {revealSavings ? (
        <dl id="insight-savings" className={cn("mt-3 grid grid-cols-2 gap-3 text-sm", stepId === "savings" && "rounded-lg p-2 ring-2 ring-violet-500")}>
          <Stat label="Daily saving" value={formatMoney(insight.dailySavingUsd)} />
          <Stat label="Monthly saving" value={formatMoney(insight.monthlySavingUsd)} />
        </dl>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Review</Button>
        {insight.plan ? (
          <Button size="sm" className={cn(stepId === "apply" && "ring-2 ring-violet-500 ring-offset-2")} disabled={insight.applied} onClick={() => onApply(insight.id)}>
            {insight.applied ? "Applied" : "Apply optimization"}
          </Button>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen} title={insight.title}>
        <dl className="space-y-3 text-sm">
          <Row label="What happened" value={insight.what} />
          <Row label="Why it matters" value={insight.why} />
          <Row label="What caused it" value={insight.cause} />
          <Row label="Recommended action" value={insight.actionLabel} />
          <Row label="Expected energy effect" value={insight.wasteKw !== null ? formatPower(insight.wasteKw) : "Cost shift, not a load cut"} />
          <Row label="Expected cost saving" value={`${formatMoney(insight.dailySavingUsd)} / day · ${formatMoney(insight.monthlySavingUsd)} / month`} />
          <Row label="Confidence" value={`${insight.confidence}%`} />
        </dl>
        {insight.contextNotes.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-zinc-500">
            {insight.contextNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        ) : null}
        {insight.plan ? <p className="mt-4 text-xs text-zinc-500">Applying sends this plan through the optimization engine. Devices under local control are left unchanged.</p> : null}
      </Dialog>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="num mt-0.5">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
