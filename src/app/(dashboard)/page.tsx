"use client";

import { RecommendationCard } from "@/components/ai/recommendation-card";
import { ContextPanel } from "@/components/context/context-panel";
import { useEnergy } from "@/components/energy/use-energy";
import { EnergyFlowDiagram } from "@/components/energy-flow/energy-flow";
import { KpiCard } from "@/components/kpi/kpi-card";
import { Card } from "@/components/ui/card";
import { formatMoney, formatPercent, formatPower } from "@/lib/format";
import { useEnergyStore } from "@/lib/engine/store";
import { toast } from "sonner";

export default function OverviewPage() {
  const { snapshot, derived, insights, savings } = useEnergy();
  const highlight = useEnergyStore((state) => state.highlight);
  const applyInsight = useEnergyStore((state) => state.applyInsight);
  const lead = insights.find((insight) => insight.category === "opportunity") ?? insights[0];
  const ring = (id: string) => (highlight === id ? "ring-2 ring-violet-500" : "");
  const todaySavings = snapshot.campus.baselineSavingsUsd + savings.dailyUsd;
  const normal = snapshot.campus.context.deviationLabel ? true : Math.abs(derived.deviationPct) < 12 || snapshot.campus.context.registrationPeriod || snapshot.campus.context.highOccupancyEvent;
  const sources = [
    `${formatPower(derived.solarKw)} solar`,
    derived.batteryPowerKw < -0.5 ? `battery charging ${formatPower(-derived.batteryPowerKw)}` : derived.batteryPowerKw > 0.5 ? `${formatPower(derived.batteryPowerKw)} from the battery` : "battery idle",
    derived.gridExportKw > 0.5 ? `exporting ${formatPower(derived.gridExportKw)}` : `${formatPower(derived.gridImportKw)} from the grid`,
  ].join(" · ");

  return (
    <div className="space-y-4">
      <p className={`text-sm ${normal ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
        {normal ? "Inside the expected range" : "Outside the expected range"} · {derived.statusLabel}
      </p>
      <div id="kpi-row" className={`grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] ${ring("kpi-row")}`}>
        <KpiCard label="Current power" value={derived.campusPowerKw} display={(value) => formatPower(value)} hint={sources} size="hero" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <KpiCard label="Solar" value={derived.solarKw} display={(value) => formatPower(value)} tone="green" size="compact" />
          <KpiCard label="Battery" value={derived.batterySoc} display={(value) => formatPercent(value)} hint={derived.batteryPowerKw < -0.5 ? "Charging" : derived.batteryPowerKw > 0.5 ? "Supplying" : "Idle"} size="compact" />
          <KpiCard label="Grid" value={derived.gridImportKw} display={(value) => formatPower(value)} tone="blue" hint={derived.gridExportKw > 0.5 ? `Export ${formatPower(derived.gridExportKw)}` : "Import"} size="compact" />
          <KpiCard label="Today's cost" value={snapshot.campus.todayCostUsd} display={(value) => formatMoney(value)} size="compact" />
          <KpiCard label="Savings" value={todaySavings} display={(value) => formatMoney(value)} tone="violet" size="compact" />
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="px-4 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Energy flow</p>
          </div>
          <EnergyFlowDiagram derived={derived} />
        </Card>
        <Card className="xl:col-span-2">
          <ContextPanel derived={derived} context={snapshot.campus.context} />
        </Card>
      </div>
      {lead ? <RecommendationCard insight={lead} onApply={(id) => applyInsight(id).forEach((note) => toast.message(note))} /> : (
        <Card className="p-4 text-sm text-zinc-500">No active recommendation. Consumption is inside the context-adjusted range.</Card>
      )}
      <div id="savings-strip" className={`grid gap-3 sm:grid-cols-3 ${ring("savings-strip")}`}>
        <Card className="px-4 py-3"><p className="text-xs text-zinc-500">Verified power reduction</p><p className="num mt-1 text-lg">{formatPower(savings.powerKw)}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-zinc-500">Cost avoided today</p><p className="num mt-1 text-lg">{formatMoney(todaySavings)}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-zinc-500">Monthly projection from applied plans</p><p className="num mt-1 text-lg">{formatMoney(savings.monthlyUsd)}</p></Card>
      </div>
    </div>
  );
}
