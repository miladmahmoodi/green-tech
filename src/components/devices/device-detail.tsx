"use client";

import { ActualExpectedChart } from "@/components/charts/charts";
import { ConnectivityBadge, ControlModeBadge, DeviceStateBadge } from "@/components/devices/badges";
import { DeviceControls, MonitoringPanel } from "@/components/devices/device-controls";
import { RecommendationCard } from "@/components/ai/recommendation-card";
import { useEnergy } from "@/components/energy/use-energy";
import { deviceLocation, devicePower } from "@/lib/engine/model";
import { catalogTelemetry } from "@/lib/engine/views";
import { useEnergyStore } from "@/lib/engine/store";
import { deviceTypeLabel, formatAgo, formatEnergy, formatPower } from "@/lib/format";
import { toast } from "sonner";

export function DeviceDetail({ id }: { id: string }) {
  const { snapshot, insights } = useEnergy();
  const applyInsight = useEnergyStore((state) => state.applyInsight);
  const device = snapshot.devices.find((item) => item.id === id);
  if (!device) return <p className="text-sm text-zinc-500">This device is not in the current campus model.</p>;
  const related = insights.filter((insight) => insight.location.toLowerCase().includes(deviceLocation(snapshot, device).toLowerCase().split(" ")[0] ?? "") || insight.plan?.actions.some((action) => action.type === "set_device" && action.id === device.id));
  const rules = snapshot.rules.filter((rule) => rule.then.some((step) => step.plan.type === "set_device" && step.plan.id === device.id) || rule.then.some((step) => step.plan.type === "set_devices" && step.plan.filter.roomId === device.roomId && step.plan.filter.type === device.type));
  const series = catalogTelemetry().intraday.campus.map((point) => ({ ...point, actual: point.actual * (devicePower(device) / Math.max(snapshot.campus.baselinePowerKw, 1)) }));

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{deviceTypeLabel(device.type)}</p>
        <h2 className="text-xl font-medium">{device.name}</h2>
        <p className="text-sm text-zinc-500">{deviceLocation(snapshot, device)}</p>
      </header>
      <div className="flex flex-wrap gap-2">
        <DeviceStateBadge state={device.state} />
        <ConnectivityBadge status={device.status} />
        <ControlModeBadge mode={device.controlMode} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-zinc-500">Power</dt><dd className="num">{formatPower(devicePower(device))}</dd></div>
        <div><dt className="text-xs text-zinc-500">Energy today</dt><dd className="num">{formatEnergy(device.props?.energyTodayKwh ?? devicePower(device) * 6)}</dd></div>
        <div><dt className="text-xs text-zinc-500">Last seen</dt><dd>{formatAgo(device.lastSeen, snapshot.demoNow)}</dd></div>
        <div><dt className="text-xs text-zinc-500">Control</dt><dd>{device.controllable && device.controlMode !== "manual" ? "Remote" : "Local / monitoring"}</dd></div>
      </dl>
      <DeviceControls device={device} />
      <MonitoringPanel device={device} />
      <div>
        <h3 className="mb-2 text-sm font-medium">Historical profile</h3>
        <ActualExpectedChart data={series} />
      </div>
      <div>
        <h3 className="text-sm font-medium">Recent events</h3>
        <ul className="mt-2 space-y-1 text-sm text-zinc-500">
          <li>State reported {device.state.toUpperCase()} · {formatAgo(device.lastSeen, snapshot.demoNow)}</li>
          {device.status !== "connected" ? <li>Connectivity changed to {device.status}.</li> : <li>Link healthy.</li>}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-medium">Automation rules</h3>
        {rules.length === 0 ? <p className="mt-1 text-sm text-zinc-500">No rule targets this device directly.</p> : (
          <ul className="mt-2 space-y-1 text-sm">{rules.map((rule) => <li key={rule.id}>{rule.name} · {rule.enabled ? "Enabled" : "Disabled"}</li>)}</ul>
        )}
      </div>
      {related.slice(0, 1).map((insight) => (
        <RecommendationCard key={insight.id} insight={insight} onApply={(insightId) => { const notes = applyInsight(insightId); notes.forEach((note) => toast.message(note)); }} />
      ))}
    </div>
  );
}
