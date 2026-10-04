"use client";

import { floorStatus } from "@/components/floor-plan/floor-plan-view";
import { stateLabel } from "@/lib/floor-plan/zone-state";
import { useEnergy } from "@/components/energy/use-energy";
import { devicePower } from "@/lib/engine/model";
import { formatPower } from "@/lib/format";
import type { Floor, FloorPlan } from "@/types/energy";
import Link from "next/link";

export function BuildingStack({ buildingName, floors, plans }: { buildingName: string; floors: Floor[]; plans: FloorPlan[] }) {
  const { snapshot, derived } = useEnergy();
  const rows = [...floors].sort((a, b) => b.level - a.level);
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <p className="border-b border-zinc-200 px-4 py-3 text-xs uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800">{buildingName}</p>
      <ul>
        {rows.map((floor) => {
          const plan = plans.find((item) => item.floorId === floor.id);
          const metered = snapshot.devices.filter((device) => device.floorId === floor.id).reduce((sum, device) => sum + devicePower(device), 0);
          const status = plan ? floorStatus(snapshot, derived, plan) : "normal";
          return (
            <li key={floor.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
              <Link href={`/campus/${floor.buildingId}/${floor.id}`} className="flex items-center gap-4 px-4 py-3 text-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 dark:hover:bg-zinc-800/50">
                <span className="w-40 font-medium">{floor.name}</span>
                <span className="num text-zinc-500">{formatPower(metered)}</span>
                <span className="ml-auto text-xs uppercase tracking-wide text-zinc-500">{stateLabel(status)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
