"use client";

import { ActualExpectedChart, BreakdownBarChart, TrendChart } from "@/components/charts/charts";
import { useEnergy } from "@/components/energy/use-energy";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { catalogTelemetry, liveSeries } from "@/lib/engine/views";
import { deviceTypeLabel, formatMoney } from "@/lib/format";
import type { DeviceType } from "@/types/energy";
import { useMemo, useState } from "react";

export default function AnalyticsPage() {
  const { snapshot, derived } = useEnergy();
  const telemetry = catalogTelemetry();
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [buildingId, setBuildingId] = useState("all");
  const [floorId, setFloorId] = useState("all");
  const [roomId, setRoomId] = useState("all");
  const [deviceType, setDeviceType] = useState<DeviceType | "all">("all");

  const share = useMemo(() => {
    if (roomId !== "all") return (derived.powerByRoom[roomId] ?? 0) / Math.max(derived.campusPowerKw, 1);
    if (floorId !== "all") return (derived.powerByFloor[floorId] ?? 0) / Math.max(derived.campusPowerKw, 1);
    if (buildingId !== "all") return (derived.powerByBuilding[buildingId] ?? 0) / Math.max(derived.campusPowerKw, 1);
    if (deviceType !== "all") return (derived.powerByCategory.find((item) => item.type === deviceType)?.powerKw ?? 0) / Math.max(derived.campusPowerKw, 1);
    return 1;
  }, [buildingId, floorId, roomId, deviceType, derived]);

  const history = telemetry[range].map((point) => ({ ...point, kwh: Math.round(point.kwh * share), cost: Math.round(point.cost * share * 100) / 100, solarKwh: Math.round(point.solarKwh * share), savingsUsd: Math.round(point.savingsUsd * share * 100) / 100, co2Kg: Math.round(point.co2Kg * share) }));
  const seriesKey = buildingId !== "all" ? buildingId : "campus";
  const co2 = Math.round(derived.actualKwh * snapshot.campus.co2KgPerKwh * share);

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="History from the campus files, scaled to the filter you pick." />
      <div className="flex flex-wrap gap-2">
        <select aria-label="Date range" value={range} onChange={(event) => setRange(event.target.value as typeof range)} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <select aria-label="Building" value={buildingId} onChange={(event) => { setBuildingId(event.target.value); setFloorId("all"); setRoomId("all"); }} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="all">All buildings</option>
          {snapshot.buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
        </select>
        <select aria-label="Floor" value={floorId} onChange={(event) => { setFloorId(event.target.value); setRoomId("all"); }} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="all">All floors</option>
          {snapshot.floors.filter((floor) => buildingId === "all" || floor.buildingId === buildingId).map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
        </select>
        <select aria-label="Room" value={roomId} onChange={(event) => setRoomId(event.target.value)} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="all">All rooms</option>
          {snapshot.rooms.filter((room) => (buildingId === "all" || room.buildingId === buildingId) && (floorId === "all" || room.floorId === floorId)).map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
        <select aria-label="Device type" value={deviceType} onChange={(event) => setDeviceType(event.target.value as DeviceType | "all")} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="all">All device types</option>
          {derived.powerByCategory.map((item) => <option key={item.type} value={item.type}>{deviceTypeLabel(item.type)}</option>)}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-zinc-500">Consumption</p><p className="num mt-1 text-xl">{Math.round(derived.actualKwh * share).toLocaleString("en-US")} kWh</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Cost</p><p className="num mt-1 text-xl">{formatMoney(snapshot.campus.todayCostUsd * share)}</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Peak in view</p><p className="num mt-1 text-xl">{history[history.length - 1]?.peakKw ?? 0} kW</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">CO₂</p><p className="num mt-1 text-xl">{co2.toLocaleString("en-US")} kg</p></Card>
      </div>
      <Card className="p-4"><h2 className="mb-3 text-sm font-medium">Actual vs expected</h2><ActualExpectedChart data={liveSeries(snapshot, derived, seriesKey)} /></Card>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">Energy by building</h2><BreakdownBarChart data={snapshot.buildings.map((building) => ({ name: building.code, powerKw: Math.round((derived.powerByBuilding[building.id] ?? 0) * 10) / 10 }))} /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">Energy by category</h2><BreakdownBarChart data={derived.powerByCategory.map((item) => ({ name: deviceTypeLabel(item.type), powerKw: item.powerKw }))} /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">{range} consumption</h2><TrendChart data={history} dataKey="kwh" name="kWh" /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">Cost trend</h2><TrendChart data={history} dataKey="cost" name="Cost" color="#60a5fa" /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">Solar generation</h2><TrendChart data={history} dataKey="solarKwh" name="Solar kWh" color="#34d399" /></Card>
        <Card className="p-4"><h2 className="mb-3 text-sm font-medium">Battery throughput</h2><TrendChart data={history} dataKey="batteryKwh" name="Battery kWh" color="#a78bfa" /></Card>
      </div>
    </div>
  );
}
