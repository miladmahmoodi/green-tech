"use client";

import { ActualExpectedChart, BreakdownBarChart } from "@/components/charts/charts";
import { useEnergy } from "@/components/energy/use-energy";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { liveSeries } from "@/lib/engine/views";
import { deviceTypeLabel, formatMoney, formatPower } from "@/lib/format";

export default function EnergyPage() {
  const { snapshot, derived } = useEnergy();
  const hvacOn = snapshot.devices.filter((device) => device.type === "hvac" && device.state === "on").length;
  const lightsOn = snapshot.devices.filter((device) => device.type === "lighting" && device.state === "on").length;
  const temps = snapshot.devices.filter((device) => device.props?.currentTempC).map((device) => device.props?.currentTempC ?? 0);
  const avgTemp = temps.length ? temps.reduce((sum, value) => sum + value, 0) / temps.length : snapshot.campus.context.outdoorTempC;

  return (
    <div className="space-y-5">
      <PageHeader title="Live energy" description="Demand against the context-adjusted expectation." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-zinc-500">Current power</p><p className="num mt-1 text-xl">{formatPower(derived.campusPowerKw)}</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Today</p><p className="num mt-1 text-xl">{Math.round(derived.actualKwh).toLocaleString("en-US")} kWh</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Cost</p><p className="num mt-1 text-xl">{formatMoney(snapshot.campus.todayCostUsd)}</p><p className="text-xs text-zinc-500">{formatMoney(derived.costPerHour)} / hour from the grid</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Conditions</p><p className="mt-1 text-sm">{derived.people} people · {avgTemp.toFixed(1)}°C indoors</p><p className="text-xs text-zinc-500">{hvacOn} HVAC on · {lightsOn} lights on</p></Card>
      </div>
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium">Actual, expected, and baseline</h2>
        <ActualExpectedChart data={liveSeries(snapshot, derived, "campus")} />
      </Card>
      <div className="grid gap-3 xl:grid-cols-3">
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">By building</h2><BreakdownBarChart data={snapshot.buildings.map((building) => ({ name: building.code, powerKw: Math.round((derived.powerByBuilding[building.id] ?? 0) * 10) / 10 }))} /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">By floor</h2><BreakdownBarChart data={snapshot.floors.map((floor) => ({ name: floor.name.replace(" · ", " "), powerKw: Math.round((derived.powerByFloor[floor.id] ?? 0) * 10) / 10 }))} /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">By category</h2><BreakdownBarChart data={derived.powerByCategory.map((item) => ({ name: deviceTypeLabel(item.type), powerKw: item.powerKw }))} /></Card>
      </div>
    </div>
  );
}
