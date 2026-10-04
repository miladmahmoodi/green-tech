import Link from "next/link";

import { HeatLegend } from "@/components/charts/heat-legend";
import { formatPower } from "@/lib/format";
import { heatColor } from "@/lib/heat";
import type { Building } from "@/types/energy";

export function BuildingHeatList({
  buildings,
  powerByBuilding,
  activeId,
  columns = false,
  legend = true,
}: {
  buildings: Building[];
  powerByBuilding: Record<string, number>;
  activeId?: string;
  columns?: boolean;
  legend?: boolean;
}) {
  const hottest = Math.max(0, ...buildings.map((building) => powerByBuilding[building.id] ?? 0));
  const ranked = [...buildings].sort((left, right) => (powerByBuilding[right.id] ?? 0) - (powerByBuilding[left.id] ?? 0));

  return (
    <div>
      <ol className={columns ? "grid gap-2 md:grid-cols-2" : "space-y-2"}>
        {ranked.map((building) => {
          const power = powerByBuilding[building.id] ?? 0;
          const dimmed = Boolean(activeId) && building.id !== activeId;
          return (
            <li key={building.id}>
              <Link
                href={`/campus/${building.id}`}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-zinc-900 ${dimmed ? "border-zinc-200 opacity-45 dark:border-zinc-800" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"} ${activeId === building.id ? "ring-2 ring-violet-500" : ""}`}
              >
                <span className="h-4 w-4 shrink-0 rounded-sm border border-black/10" style={{ backgroundColor: heatColor(power, hottest) }} />
                <span className="min-w-0 flex-1 leading-tight">{building.name}</span>
                <span className="num shrink-0 text-xs text-zinc-500">{formatPower(power)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {legend ? <HeatLegend /> : null}
    </div>
  );
}
