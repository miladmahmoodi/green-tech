"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEnergy } from "@/components/energy/use-energy";
import { catalogOpportunities } from "@/lib/engine/views";
import { useEnergyStore } from "@/lib/engine/store";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

export default function OptimizationPage() {
  const { snapshot, insights } = useEnergy();
  const applyInsight = useEnergyStore((state) => state.applyInsight);
  const opportunities = catalogOpportunities();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium">Optimization center</h1>
        <p className="text-sm text-zinc-500">Standing opportunities stay visible. Live ones appear when the campus state matches their trigger.</p>
      </header>
      <div className="grid gap-3 lg:grid-cols-3">
        {opportunities.map((item) => {
          const live = insights.find((insight) => insight.id === item.id);
          const applied = snapshot.appliedInsightIds.includes(item.id);
          const ready = Boolean(live) || item.standing;
          return (
            <Card key={item.id} className="flex flex-col p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{item.location}</p>
              <h2 className="mt-2 text-base font-medium">{item.actionLabel}</h2>
              <p className="num mt-3 text-2xl">{formatMoney(item.monthlySavingUsd)}<span className="text-sm text-zinc-500"> / month</span></p>
              <p className="mt-2 text-sm text-zinc-500">{item.confidence}% confidence</p>
              <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-300">{item.what}</p>
              <div className="mt-4">
                {item.plan && ready ? (
                  <Button size="sm" disabled={applied || (!live && !item.standing)} onClick={() => { const notes = applyInsight(item.id); notes.forEach((note) => toast.message(note)); if (!notes.length) toast.success("Plan sent to the optimizer"); }}>
                    {applied ? "Applied" : "Review and apply"}
                  </Button>
                ) : (
                  <p className="text-xs text-zinc-500">{live ? "Waiting for context" : "Not active in the current context"}</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
