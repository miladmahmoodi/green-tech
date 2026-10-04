"use client";

import { liveZones, stateLabel, worstState, type PlanMode, type ZoneLive, type ZoneVisualState } from "@/lib/floor-plan/zone-state";
import { useEnergy } from "@/components/energy/use-energy";
import { formatMoney, formatPower } from "@/lib/format";
import { useEnergyStore } from "@/lib/engine/store";
import type { FloorPlan } from "@/types/energy";
import { AlertTriangle, Check, Circle, Sparkles, Unplug, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MODES: { id: PlanMode; label: string }[] = [
  { id: "energy", label: "Energy" },
  { id: "occupancy", label: "Occupancy" },
  { id: "optimization", label: "Optimization" },
  { id: "health", label: "Device health" },
];

const STATE_CLASS: Record<ZoneVisualState, string> = {
  normal: "border-zinc-500/70 bg-zinc-900/55",
  occupied: "border-blue-400/80 bg-blue-500/15",
  opportunity: "border-amber-400/90 bg-amber-500/15",
  anomaly: "border-red-400/90 bg-red-500/15",
  offline: "border-zinc-400 border-dashed bg-zinc-800/70",
  optimized: "border-emerald-400/90 bg-emerald-500/15",
};

function StateMark({ state }: { state: ZoneVisualState }) {
  const className = "h-3.5 w-3.5 shrink-0";
  if (state === "opportunity") return <Sparkles className={`${className} text-amber-300`} aria-hidden />;
  if (state === "anomaly") return <AlertTriangle className={`${className} text-red-300`} aria-hidden />;
  if (state === "offline") return <Unplug className={`${className} text-zinc-300`} aria-hidden />;
  if (state === "optimized") return <Check className={`${className} text-emerald-300`} aria-hidden />;
  if (state === "occupied") return <Users className={`${className} text-blue-300`} aria-hidden />;
  return <Circle className={`${className} text-zinc-300`} aria-hidden />;
}

function modeDetail(zone: ZoneLive, mode: PlanMode): string {
  if (mode === "occupancy") return zone.capacity > 0 ? `${zone.people} people · ${Math.round((zone.people / zone.capacity) * 100)}%` : `${zone.people} people`;
  if (mode === "optimization") return stateLabel(zone.state);
  if (mode === "health") return `${zone.connected} connected · ${zone.warning} warning · ${zone.offline} offline`;
  return formatPower(zone.powerKw);
}

export function FloorPlanView({ plan, initialZoneId }: { plan: FloorPlan; initialZoneId?: string }) {
  const { snapshot, derived } = useEnergy();
  const applyInsight = useEnergyStore((state) => state.applyInsight);
  const [mode, setMode] = useState<PlanMode>("energy");
  const [selectedId, setSelectedId] = useState<string | null>(initialZoneId ?? null);
  useEffect(() => {
    if (initialZoneId) setSelectedId(initialZoneId);
  }, [initialZoneId]);
  const zones = useMemo(() => liveZones(snapshot, derived, plan), [snapshot, derived, plan]);
  const selected = zones.find((zone) => zone.zone.id === selectedId) ?? null;
  const power = zones.reduce((sum, zone) => sum + zone.powerKw, 0);
  const expected = zones.reduce((sum, zone) => sum + zone.expectedKw, 0);
  const people = zones.reduce((sum, zone) => sum + zone.people, 0);
  const opportunities = zones.filter((zone) => zone.state === "opportunity").length;
  const offlineDevices = zones.reduce((sum, zone) => sum + zone.offline, 0);
  const saving = zones.reduce((sum, zone) => sum + zone.dailySavingUsd, 0);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Summary label="Current power" value={formatPower(power)} />
        <Summary label="Expected" value={formatPower(expected)} />
        <Summary label="Occupancy" value={String(people)} />
        <Summary label="Opportunities" value={String(opportunities)} />
        <Summary label="Offline devices" value={String(offlineDevices)} />
        <Summary label="Estimated saving" value={`${formatMoney(saving)}/day`} />
      </div>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Floor plan mode">
        {MODES.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} onClick={() => setMode(item.id)} className={`rounded-full px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mode === item.id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
          <Image src={plan.floorPlan} alt="" width={plan.width} height={plan.height} className="block h-auto w-full" />
          {zones.map((zone) => {
            const box = zone.zone.geometry;
            return (
              <button
                key={zone.zone.id}
                type="button"
                aria-pressed={selectedId === zone.zone.id}
                onClick={() => setSelectedId(zone.zone.id)}
                className={`absolute overflow-hidden rounded-md border px-2 py-1.5 text-left text-white backdrop-blur-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${STATE_CLASS[zone.state]} ${selectedId === zone.zone.id ? "ring-2 ring-white" : ""}`}
                style={{ left: `${(box.x / plan.width) * 100}%`, top: `${(box.y / plan.height) * 100}%`, width: `${(box.width / plan.width) * 100}%`, height: `${(box.height / plan.height) * 100}%` }}
              >
                <span className="flex items-center gap-1 text-[11px] font-medium leading-tight">
                  <StateMark state={zone.state} />
                  <span className="truncate">{zone.zone.name}</span>
                </span>
                <span className="num mt-1 block text-sm">{modeDetail(zone, mode)}</span>
                <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wide text-zinc-300">{stateLabel(zone.state)}</span>
              </button>
            );
          })}
        </div>
        <aside className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {selected ? <ZonePanel zone={selected} onApply={(id) => { const notes = applyInsight(id); if (notes.length === 0) toast.success("Optimization applied"); notes.forEach((note) => toast.message(note)); }} /> : <p className="text-sm text-zinc-500">Select a room to see its energy state, occupancy, and any recommendation. Devices stay in the Devices section.</p>}
        </aside>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="num mt-1 text-lg">{value}</p>
    </div>
  );
}

function ZonePanel({ zone, onApply }: { zone: ZoneLive; onApply: (id: string) => void }) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-500"><StateMark state={zone.state} /> {stateLabel(zone.state)}</p>
        <h2 className="mt-1 text-base font-medium">{zone.zone.name}</h2>
      </div>
      <dl className="grid grid-cols-2 gap-2">
        <Field label="Occupancy" value={zone.capacity > 0 ? `${zone.people} / ${zone.capacity}` : String(zone.people)} />
        <Field label="Current power" value={formatPower(zone.powerKw)} />
        <Field label="Expected power" value={formatPower(zone.expectedKw)} />
        <Field label="Temperature" value={zone.temperatureC === null ? "—" : `${zone.temperatureC.toFixed(1)}°C`} />
        <Field label="HVAC" value={zone.hvacOn ? `On · ${zone.hvacMode ?? "auto"}` : "Off"} />
        <Field label="Lighting" value={zone.lightsTotal ? `${zone.lightsOn} / ${zone.lightsTotal} on` : "—"} />
        <Field label="Computers" value={`${zone.computersOn} active`} />
        <Field label="Health" value={`${zone.connected} connected · ${zone.offline} offline`} />
      </dl>
      {zone.insightText ? (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-violet-500">AI insight</p>
          <p className="mt-1">{zone.insightText}</p>
          <p className="mt-2 text-zinc-500">{zone.deviationPct > 1 ? `${zone.deviationPct.toFixed(0)}% above expected.` : zone.deviationPct < -1 ? `${Math.abs(zone.deviationPct).toFixed(0)}% below expected.` : "Inside the expected range."}</p>
          <p className="num mt-1">Potential saving {formatMoney(zone.dailySavingUsd)}/day</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {zone.insightId ? <button type="button" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:bg-zinc-100 dark:text-zinc-950" onClick={() => onApply(zone.insightId!)}>Apply optimization</button> : null}
            <Link href="/advisor" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-zinc-700">View optimization</Link>
          </div>
        </div>
      ) : <p className="text-xs text-zinc-500">No active recommendation for this room.</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-zinc-500">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

export function floorStatus(snapshot: Parameters<typeof liveZones>[0], derived: Parameters<typeof liveZones>[1], plan: FloorPlan): ZoneVisualState {
  return worstState(liveZones(snapshot, derived, plan).map((zone) => zone.state));
}
