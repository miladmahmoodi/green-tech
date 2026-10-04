"use client";

import { RecommendationCard } from "@/components/ai/recommendation-card";
import { SolarBatteryChart } from "@/components/charts/charts";
import { useEnergy } from "@/components/energy/use-energy";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useEnergyStore } from "@/lib/engine/store";
import { formatMoney, formatPercent, formatPower } from "@/lib/format";
import { toast } from "sonner";

export default function SolarBatteryPage() {
  const { snapshot, derived, insights } = useEnergy();
  const highlight = useEnergyStore((state) => state.highlight);
  const applyInsight = useEnergyStore((state) => state.applyInsight);
  const strategy = insights.find((insight) => insight.id === "solar-charge" || insight.id === "peak-discharge" || insight.id === "battery-full");
  const ring = (id: string) => (highlight === id ? "ring-2 ring-violet-500" : "");
  return (
    <div className="space-y-5">
      <PageHeader title="Solar and battery" description="Generation, storage, and the price of the next kilowatt-hour." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-zinc-500">Solar generation</p><p className="num mt-1 text-xl text-emerald-500">{formatPower(derived.solarKw)}</p><p className="text-xs text-zinc-500">Capacity {formatPower(snapshot.solar.capacityKw)} · inverter {snapshot.solar.inverterStatus}</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Battery</p><p className="num mt-1 text-xl">{formatPercent(derived.batterySoc)}</p><p className="text-xs text-zinc-500">{derived.batteryPowerKw < 0 ? `Charging ${formatPower(-derived.batteryPowerKw)}` : derived.batteryPowerKw > 0 ? `Discharging ${formatPower(derived.batteryPowerKw)}` : "Idle"} · {snapshot.battery.capacityKwh} kWh</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Grid</p><p className="num mt-1 text-xl text-blue-500">{formatPower(derived.gridImportKw)} in</p><p className="text-xs text-zinc-500">{formatPower(derived.gridExportKw)} out</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Building demand</p><p className="num mt-1 text-xl">{formatPower(derived.campusPowerKw)}</p><p className="text-xs text-zinc-500">Surplus {formatPower(derived.surplusKw)}</p></Card>
      </div>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium">24-hour generation, demand, price, and battery</h2>
        <SolarBatteryChart data={snapshot.solar.curve.map((point) => point.t === "10:30" ? { ...point, generationKw: derived.solarKw, demandKw: derived.campusPowerKw, priceUsd: derived.priceUsd, batteryKw: derived.batteryPowerKw } : point)} />
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card id="strategy-panel" className={`p-4 ${ring("strategy-panel")}`}>
          <h2 className="text-sm font-medium">Energy strategy</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-zinc-500">Solar</dt><dd className="num">{formatPower(derived.solarKw)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Building</dt><dd className="num">{formatPower(derived.campusPowerKw)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Surplus</dt><dd className="num">{formatPower(derived.surplusKw)}</dd></div>
            <div><dt className="text-xs text-zinc-500">Grid price</dt><dd>{derived.isPeak ? "Peak" : "Low"} · {formatMoney(derived.priceUsd)}/kWh</dd></div>
          </dl>
        </Card>
        <Card id="peak-panel" className={`p-4 ${ring("peak-panel")}`}>
          <h2 className="text-sm font-medium">Peak pricing</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-zinc-500">Current</dt><dd className="num">{formatMoney(snapshot.prices.currentUsdPerKwh)} / kWh</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Peak</dt><dd className="num">{formatMoney(snapshot.prices.peakUsdPerKwh)} / kWh</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Upcoming peak</dt><dd>{snapshot.prices.peakWindow}</dd></div>
          </dl>
          <p className="mt-3 text-sm">Reserve battery capacity for the evening peak period.</p>
        </Card>
      </div>
      {strategy ? <RecommendationCard insight={strategy} onApply={(id) => { const notes = applyInsight(id); if (notes.length === 0) toast.success("Battery plan applied"); notes.forEach((note) => toast.message(note)); }} /> : null}
    </div>
  );
}
