"use client";

import { ActualExpectedChart } from "@/components/charts/charts";
import { AlertCard } from "@/components/alerts/alert-card";
import { useEnergy } from "@/components/energy/use-energy";
import { DeviceControls } from "@/components/devices/device-controls";
import { ConnectivityBadge, DeviceStateBadge } from "@/components/devices/badges";
import { BuildingStack } from "@/components/floor-plan/building-stack";
import { FloorPlanView } from "@/components/floor-plan/floor-plan-view";
import { Card } from "@/components/ui/card";
import { mockDataProvider } from "@/lib/mock-data";
import { devicePower } from "@/lib/engine/model";
import { catalogTelemetry, liveSeries } from "@/lib/engine/views";
import { useEnergyStore } from "@/lib/engine/store";
import { deviceTypeLabel, formatEnergy, formatMoney, formatPower } from "@/lib/format";
import Link from "next/link";

export function CampusExplorer({ path }: { path: string[] }) {
  const { snapshot, derived, alerts } = useEnergy();
  const highlight = useEnergyStore((state) => state.highlight);
  const acknowledge = useEnergyStore((state) => state.acknowledgeAlert);
  const dismiss = useEnergyStore((state) => state.dismissAlert);
  const [buildingId, floorId, roomId] = path;
  const building = snapshot.buildings.find((item) => item.id === buildingId);
  const floor = snapshot.floors.find((item) => item.id === floorId);
  const room = snapshot.rooms.find((item) => item.id === roomId);

  const crumb = [
    { href: "/campus", label: snapshot.campus.name },
    building ? { href: `/campus/${building.id}`, label: building.name } : null,
    floor ? { href: `/campus/${building?.id}/${floor.id}`, label: floor.name } : null,
    room ? { href: `/campus/${building?.id}/${floor?.id}/${room.id}`, label: room.name } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  let children: { href: string; title: string; meta: string }[] = [];
  if (!building) {
    children = snapshot.buildings.map((item) => ({ href: `/campus/${item.id}`, title: item.name, meta: formatPower(derived.powerByBuilding[item.id] ?? 0) }));
  } else if (!floor) {
    children = snapshot.floors.filter((item) => item.buildingId === building.id).map((item) => ({ href: `/campus/${building.id}/${item.id}`, title: item.name, meta: formatPower(derived.powerByFloor[item.id] ?? 0) }));
  } else if (!room) {
    children = snapshot.rooms.filter((item) => item.floorId === floor.id).map((item) => ({ href: `/campus/${building.id}/${floor.id}/${item.id}`, title: item.name, meta: `${derived.peopleByRoom[item.id] ?? 0} people · ${formatPower(derived.powerByRoom[item.id] ?? 0)}` }));
  }

  const scopePower = room ? derived.powerByRoom[room.id] ?? 0 : floor ? derived.powerByFloor[floor.id] ?? 0 : building ? derived.powerByBuilding[building.id] ?? 0 : derived.campusPowerKw;
  const scopePeople = room
    ? derived.peopleByRoom[room.id] ?? 0
    : building
      ? snapshot.occupancy
          .filter((record) => snapshot.rooms.some((item) => item.id === record.roomId && item.buildingId === building.id && (!floor || item.floorId === floor.id)))
          .reduce((sum, record) => sum + record.people, 0)
      : derived.people;
  const scopeDevices = snapshot.devices.filter((device) => (room ? device.roomId === room.id : floor ? device.floorId === floor.id : building ? device.buildingId === building.id : true));
  const activeDevices = scopeDevices.filter((device) => device.state === "on").length;
  const seriesKey = building ? building.id : "campus";
  const series = liveSeries(snapshot, derived, seriesKey);
  const cost = (scopePower / Math.max(derived.campusPowerKw, 1)) * snapshot.campus.todayCostUsd;
  const plans = mockDataProvider.getFloorPlans();
  const floorPlan = floor ? plans.find((item) => item.floorId === floor.id) : undefined;

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500" aria-label="Campus hierarchy">
        {crumb.map((item, index) => (
          <span key={item.href} className="flex items-center gap-2">
            {index > 0 ? <span>/</span> : null}
            <Link href={item.href} className="hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-zinc-100">{item.label}</Link>
          </span>
        ))}
      </nav>
      <div id="room-summary" className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${highlight === "room-summary" ? "ring-2 ring-violet-500" : ""}`}>
        <Card className="p-4"><p className="text-xs text-zinc-500">Power</p><p className="num mt-1 text-xl">{formatPower(scopePower)}</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Cost share today</p><p className="num mt-1 text-xl">{formatMoney(cost)}</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Occupancy</p><p className="num mt-1 text-xl">{scopePeople}</p></Card>
        <Card className="p-4"><p className="text-xs text-zinc-500">Active devices</p><p className="num mt-1 text-xl">{activeDevices}</p></Card>
      </div>
      <Card className="p-4">
        <p className="mb-2 text-sm font-medium">Expected and actual</p>
        <p className="mb-3 text-xs text-zinc-500">{derived.statusLabel} · today {formatEnergy(derived.actualKwh)}</p>
        <ActualExpectedChart data={room || floor ? series.map((point) => ({ ...point, actual: point.actual * (scopePower / Math.max(derived.campusPowerKw, 1)), expected: point.expected * (scopePower / Math.max(derived.campusPowerKw, 1)), baseline: point.baseline * (scopePower / Math.max(derived.campusPowerKw, 1)) })) : series} />
      </Card>
      {!building && children.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {children.map((child) => (
            <Link key={child.href} href={child.href} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-medium">{child.title}</p>
              <p className="num text-sm text-zinc-500">{child.meta}</p>
            </Link>
          ))}
        </div>
      ) : null}
      {building && !floor ? <BuildingStack buildingName={building.name} floors={snapshot.floors.filter((item) => item.buildingId === building.id)} plans={plans} /> : null}
      {floor && floorPlan ? <FloorPlanView plan={floorPlan} initialZoneId={room?.id} /> : null}
      {room ? (
        <div className="space-y-3">
          {Object.entries(groupDevices(scopeDevices)).map(([type, devices]) => (
            <Card key={type} className="p-4">
              <h2 className="text-sm font-medium">{deviceTypeLabel(type)}</h2>
              {type === "lighting" ? <p className="mt-1 text-sm text-zinc-500">{devices.filter((device) => device.state === "on").length} on · occupancy {scopePeople}. {scopePeople === 0 ? "Recommended: turn off unused lighting." : "Lighting follows occupancy."}</p> : null}
              {type === "computer" ? <p className="mt-1 text-sm text-zinc-500">{devices.filter((device) => device.state === "on").length} active · {scopePeople} occupants. {scopePeople === 0 ? "Recommendation: shut down inactive computers." : "In use."}</p> : null}
              <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                {devices.map((device) => (
                  <li key={device.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2">
                    <Link href={`/devices/${device.id}`} className="w-44 shrink-0 truncate font-medium hover:underline">{device.name}</Link>
                    <span className="num w-16 shrink-0 text-sm text-zinc-500">{formatPower(devicePower(device))}</span>
                    <DeviceStateBadge state={device.state} />
                    <ConnectivityBadge status={device.status} />
                    <div className="ml-auto min-w-0"><DeviceControls device={device} /></div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : null}
      <div className="space-y-2">
        {alerts.filter((alert) => !room || alert.location?.includes(room.name) || alert.deviceId && scopeDevices.some((device) => device.id === alert.deviceId)).slice(0, 3).map((alert) => (
          <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledge} onDismiss={dismiss} />
        ))}
      </div>
      <p className="text-xs text-zinc-500">Series source: {catalogTelemetry().daily.length} daily samples in the campus history.</p>
    </div>
  );
}

function groupDevices<T extends { type: string }>(devices: T[]): Record<string, T[]> {
  return devices.reduce<Record<string, T[]>>((groups, device) => {
    groups[device.type] = groups[device.type] ?? [];
    groups[device.type].push(device);
    return groups;
  }, {});
}
