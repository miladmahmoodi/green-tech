"use client";

import { formatPower } from "@/lib/format";
import type { HistoryPoint, TelemetryPoint } from "@/types/energy";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(resolvedTheme !== "light");
  }, [resolvedTheme]);
  return dark
    ? { grid: "#27272a", axis: "#a1a1aa", tooltip: "#18181b", border: "#3f3f46", actual: "#fafafa", baseline: "#3f3f46", baselineFill: "#27272a" }
    : { grid: "#e4e4e7", axis: "#71717a", tooltip: "#ffffff", border: "#e4e4e7", actual: "#18181b", baseline: "#a1a1aa", baselineFill: "#f4f4f5" };
}

function chartTooltip(theme: { tooltip: string; border: string; axis: string }) {
  return { background: theme.tooltip, border: `1px solid ${theme.border}`, borderRadius: 8, fontSize: 12, color: theme.axis };
}

export function ActualExpectedChart({ data }: { data: TelemetryPoint[] }) {
  const theme = useChartTheme();
  const trimmed = data.filter((_, index) => index % 2 === 0);
  const tick = { stroke: theme.axis, fontSize: 11, fill: theme.axis };
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={trimmed} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="t" tick={tick} interval={7} />
          <YAxis tick={tick} unit=" kW" width={64} />
          <Tooltip contentStyle={chartTooltip(theme)} />
          <Legend />
          <Area dataKey="baseline" name="Baseline" stroke={theme.baseline} fill={theme.baselineFill} />
          <Line dataKey="expected" name="Expected" stroke="#a78bfa" strokeWidth={2} dot={false} />
          <Line dataKey="actual" name="Actual" stroke={theme.actual} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RoomPowerChart({ data, onSelect }: { data: { id: string; name: string; powerKw: number; expectedKw: number }[]; onSelect?: (id: string) => void }) {
  const theme = useChartTheme();
  const rows = [...data].sort((left, right) => right.powerKw - left.powerKw);
  const tick = { stroke: theme.axis, fontSize: 12, fill: theme.axis };
  if (rows.length === 0) return <p className="p-4 text-sm text-zinc-500">No rooms on this floor.</p>;
  return (
    <div className="h-full min-h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} layout="vertical" margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={theme.grid} horizontal={false} />
          <XAxis type="number" tick={tick} unit=" kW" />
          <YAxis type="category" dataKey="name" width={128} tick={tick} />
          <Tooltip contentStyle={chartTooltip(theme)} formatter={(value, name) => [typeof value === "number" ? formatPower(value) : value, name]} />
          <Legend />
          <Bar dataKey="expectedKw" name="Expected" fill="#a78bfa" barSize={16} radius={[0, 4, 4, 0]} />
          <Bar dataKey="powerKw" name="Actual" fill="#3b82f6" barSize={16} radius={[0, 4, 4, 0]} cursor="pointer" onClick={(entry) => { const point = entry as { id?: string; payload?: { id?: string } }; const id = point.payload?.id ?? point.id; if (id) onSelect?.(id); }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownBarChart({ data }: { data: { name: string; powerKw: number }[] }) {
  const ranked = [...data].sort((left, right) => right.powerKw - left.powerKw);
  const peak = Math.max(...ranked.map((item) => item.powerKw), 0);
  const total = ranked.reduce((sum, item) => sum + item.powerKw, 0);
  if (ranked.length === 0) return <p className="text-sm text-zinc-500">No load in this group.</p>;
  return (
    <ul className="space-y-3">
      {ranked.map((item, index) => {
        const width = peak === 0 ? 0 : (item.powerKw / peak) * 100;
        const share = total === 0 ? 0 : Math.round((item.powerKw / total) * 100);
        return (
          <li key={`${item.name}-${index}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate">{item.name}</span>
              <span className="num shrink-0 text-zinc-500">
                <span className="text-zinc-900 dark:text-zinc-100">{formatPower(item.powerKw)}</span>
                <span className="ml-2">{share}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${width}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TrendChart({ data, dataKey, name, color }: { data: HistoryPoint[]; dataKey: keyof HistoryPoint; name: string; color?: string }) {
  const theme = useChartTheme();
  const tick = { stroke: theme.axis, fontSize: 11, fill: theme.axis };
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="label" tick={tick} />
          <YAxis tick={tick} width={56} />
          <Tooltip contentStyle={chartTooltip(theme)} />
          <Line dataKey={dataKey} name={name} stroke={color ?? theme.actual} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SolarBatteryChart({ data }: { data: { t: string; generationKw: number; demandKw: number; priceUsd: number; batteryKw: number }[] }) {
  const theme = useChartTheme();
  const tick = { stroke: theme.axis, fontSize: 11, fill: theme.axis };
  const trimmed = data.filter((_, index) => index % 2 === 0);
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={trimmed}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="t" tick={tick} interval={7} />
          <YAxis yAxisId="kw" tick={tick} width={48} />
          <YAxis yAxisId="price" orientation="right" tick={tick} width={40} />
          <Tooltip contentStyle={chartTooltip(theme)} />
          <Legend />
          <Area yAxisId="kw" dataKey="generationKw" name="Solar" stroke="#34d399" fill={theme.baselineFill} />
          <Line yAxisId="kw" dataKey="demandKw" name="Demand" stroke={theme.actual} dot={false} />
          <Bar yAxisId="kw" dataKey="batteryKw" name="Battery" fill="#a78bfa" barSize={6} />
          <Line yAxisId="price" dataKey="priceUsd" name="Price" stroke="#60a5fa" dot={false} strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
