"use client";

import Link from "next/link";
import { useMemo } from "react";

import { BreakdownBarChart } from "@/components/charts/charts";
import { useEnergy } from "@/components/energy/use-energy";
import { liveZones } from "@/lib/floor-plan/zone-state";
import { formatPower } from "@/lib/format";
import type { Floor, FloorPlan } from "@/types/energy";

export function BuildingFloorHeat({ floors, plans }: { floors: Floor[]; plans: FloorPlan[] }) {
  const { snapshot, derived } = useEnergy();
  const rows = useMemo(
    () =>
      [...floors]
        .sort((left, right) => right.level - left.level)
        .flatMap((floor) => {
          const plan = plans.find((item) => item.floorId === floor.id);
          if (!plan) return [];
          const zones = liveZones(snapshot, derived, plan);
          return [{
            floor,
            powerKw: derived.powerByFloor[floor.id] ?? 0,
            rooms: zones.map((zone) => ({ name: zone.zone.name, powerKw: zone.powerKw })),
          }];
        }),
    [floors, plans, snapshot, derived],
  );

  if (rows.length === 0) return null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((row) => (
        <section key={row.floor.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Link href={`/campus/${row.floor.buildingId}/${row.floor.id}`} className="mb-3 flex items-center justify-between text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <span className="font-medium">{row.floor.name}</span>
            <span className="num text-xs text-zinc-500">{formatPower(row.powerKw)}</span>
          </Link>
          <BreakdownBarChart data={row.rooms.length > 0 ? row.rooms : [{ name: row.floor.name, powerKw: row.powerKw }]} />
        </section>
      ))}
    </div>
  );
}
