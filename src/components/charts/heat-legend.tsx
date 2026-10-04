import { HEAT_GRADIENT, SCHEMATIC_STOPS } from "@/lib/heat";

const STOPS = Object.entries(HEAT_GRADIENT)
  .sort(([left], [right]) => Number(left) - Number(right))
  .map(([, color]) => color)
  .join(", ");

export function HeatLegend({ schematic = false }: { schematic?: boolean }) {
  const gradient = schematic ? SCHEMATIC_STOPS.join(", ") : STOPS;
  return (
    <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
      <span>Low</span>
      <span className="h-2 min-w-24 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${gradient})` }} />
      <span>High</span>
    </div>
  );
}
