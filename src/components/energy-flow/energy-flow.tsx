"use client";

import { formatPower } from "@/lib/format";
import type { Derived } from "@/lib/engine/model";

function FlowPath({ d, active, tone }: { d: string; active: boolean; tone: "green" | "blue" | "violet" }) {
  const activeClass = { green: "stroke-emerald-500", blue: "stroke-blue-500", violet: "stroke-violet-400" }[tone];
  return <path d={d} fill="none" strokeWidth={active ? 2.5 : 1.25} className={active ? `${activeClass} energy-flow` : "stroke-zinc-300 dark:stroke-zinc-700"} />;
}

function Node({ x, y, label, value, valueClass }: { x: number; y: number; label: string; value: string; valueClass: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-68} y={-26} width={136} height={52} rx={12} className="fill-white stroke-zinc-200 dark:fill-zinc-900 dark:stroke-zinc-700" />
      <text x={0} y={-4} textAnchor="middle" fontSize={11} letterSpacing={1.1} className="fill-zinc-500">
        {label}
      </text>
      <text x={0} y={16} textAnchor="middle" fontSize={15} className={valueClass} style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
        {value}
      </text>
    </g>
  );
}

function PathLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={11} className="fill-zinc-500" style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}>
      {text}
    </text>
  );
}

export function EnergyFlowDiagram({ derived }: { derived: Derived }) {
  const solarToBuilding = derived.solarToBuildingKw > 0.5;
  const solarToBattery = derived.solarToBatteryKw > 0.5;
  const batteryToBuilding = derived.batteryToBuildingKw > 0.5;
  const gridToBuilding = derived.gridToBuildingKw > 0.5;
  return (
    <div className="overflow-x-auto px-2 pb-3">
      <svg viewBox="0 0 760 250" className="min-w-[640px]" role="img" aria-label="Energy flow from solar, battery, and grid into the building">
        <FlowPath d="M 176 52 H 430" active={solarToBuilding} tone="green" />
        <FlowPath d="M 430 52 V 118" active={solarToBuilding} tone="green" />
        <FlowPath d="M 176 78 V 168 H 292" active={solarToBattery} tone="green" />
        <FlowPath d="M 428 168 H 560 V 132" active={batteryToBuilding} tone="violet" />
        <FlowPath d="M 176 188 H 560 V 146" active={gridToBuilding} tone="blue" />
        {solarToBuilding ? <PathLabel x={300} y={42} text={formatPower(derived.solarToBuildingKw)} /> : null}
        {solarToBattery ? <PathLabel x={230} y={158} text={formatPower(derived.solarToBatteryKw)} /> : null}
        {batteryToBuilding ? <PathLabel x={500} y={158} text={formatPower(derived.batteryToBuildingKw)} /> : null}
        {gridToBuilding ? <PathLabel x={360} y={204} text={formatPower(derived.gridToBuildingKw)} /> : null}
        {derived.gridExportKw > 0.5 ? <PathLabel x={360} y={228} text={`Export ${formatPower(derived.gridExportKw)}`} /> : null}
        <Node x={100} y={64} label="SOLAR" value={formatPower(derived.solarKw)} valueClass="fill-emerald-600 dark:fill-emerald-400" />
        <Node x={100} y={188} label="GRID" value={formatPower(derived.gridImportKw > 0 ? derived.gridImportKw : derived.gridExportKw)} valueClass="fill-blue-600 dark:fill-blue-400" />
        <Node x={360} y={168} label="BATTERY" value={`${Math.round(derived.batterySoc)}%`} valueClass="fill-violet-600 dark:fill-violet-400" />
        <Node x={640} y={118} label="BUILDING" value={formatPower(derived.campusPowerKw)} valueClass="fill-zinc-900 dark:fill-zinc-50" />
      </svg>
    </div>
  );
}
