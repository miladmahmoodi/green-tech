"use client";

import { RecommendationCard } from "@/components/ai/recommendation-card";
import { useEnergy } from "@/components/energy/use-energy";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useEnergyStore } from "@/lib/engine/store";
import { toast } from "sonner";

export default function AdvisorPage() {
  const { insights } = useEnergy();
  const highlight = useEnergyStore((state) => state.highlight);
  const applyInsight = useEnergyStore((state) => state.applyInsight);
  return (
    <div className="space-y-4">
      <PageHeader title="AI advisor" description="Recommendations explain the situation. Applying them runs the optimization engine, which skips anything under local control." />
      {insights.length === 0 ? <Card className="p-4 text-sm text-zinc-500">No active recommendation. The campus is inside its expected range.</Card> : null}
      <div className={`space-y-3 ${highlight?.startsWith("insight-") ? "" : ""}`}>
        {insights.map((insight) => (
          <div key={insight.id} className={highlight === `insight-${insight.id}` ? "rounded-xl ring-2 ring-violet-500" : ""}>
            <RecommendationCard insight={insight} onApply={(id) => { const notes = applyInsight(id); if (notes.length === 0) toast.success("Optimization applied"); notes.forEach((note) => toast.message(note)); }} />
          </div>
        ))}
      </div>
    </div>
  );
}
