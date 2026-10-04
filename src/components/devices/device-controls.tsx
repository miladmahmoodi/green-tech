"use client";

import { Button } from "@/components/ui/button";
import { controlBlockReason, devicePower } from "@/lib/engine/model";
import { useEnergyStore } from "@/lib/engine/store";
import { deviceTypeLabel, formatEnergy, formatPower } from "@/lib/format";
import type { Device, HvacMode } from "@/types/energy";
import { toast } from "sonner";

const MODES: HvacMode[] = ["auto", "eco", "comfort", "off"];

export function DeviceControls({ device }: { device: Device }) {
  const setDevice = useEnergyStore((state) => state.setDevice);
  const people = useEnergyStore((state) => state.occupancy.find((record) => record.roomId === device.roomId)?.people ?? 0);
  const outdoor = useEnergyStore((state) => state.campus.context.outdoorTempC);
  const price = useEnergyStore((state) => state.prices.currentUsdPerKwh);
  const reason = controlBlockReason(device);

  const run = (patch: Parameters<typeof setDevice>[1], message: string) => {
    const error = setDevice(device.id, patch);
    if (error) toast.error(error);
    else toast.success(message);
  };

  if (reason) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
        <p className="font-medium">Local control</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{reason}</p>
        <p className="mt-2 text-xs text-zinc-500">Monitoring stays available. The advisor will not include this device in a remote plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={device.state === "on" ? "default" : "outline"} onClick={() => run({ state: "on", powerKw: device.props?.ratedPowerKw ?? device.props?.comfortPowerKw ?? (device.powerKw || 0.1) }, "Turned on")}>On</Button>
        <Button size="sm" variant={device.state === "off" ? "default" : "outline"} onClick={() => run({ state: "off", powerKw: 0 }, "Turned off")}>Off</Button>
      </div>
      {(device.type === "hvac" || device.type === "heating" || device.type === "cooling") && (
        <div>
          <p className="text-xs text-zinc-500">Mode</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODES.map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={device.props?.mode === mode ? "default" : "outline"}
                onClick={() => {
                  const power = mode === "off" ? 0 : mode === "eco" ? device.props?.ecoPowerKw ?? device.powerKw : device.props?.comfortPowerKw ?? device.powerKw;
                  run({ state: mode === "off" ? "off" : "on", powerKw: power, props: { mode } }, `Mode set to ${mode}`);
                }}
              >
                {mode}
              </Button>
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Field label="Room temperature" value={`${device.props?.currentTempC ?? "—"}°C`} />
            <Field label="Target" value={`${device.props?.setpointC ?? "—"}°C`} />
            <Field label="Outdoor" value={`${outdoor}°C`} />
            <Field label="Occupancy" value={`${people} people`} />
            <Field label="Power" value={formatPower(devicePower(device))} />
            <Field label="Price" value={`$${price.toFixed(2)}/kWh`} />
          </dl>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => run({ props: { setpointC: (device.props?.setpointC ?? 22) - 0.5 } }, "Setpoint lowered")}>Setpoint −</Button>
            <Button size="sm" variant="outline" onClick={() => run({ props: { setpointC: (device.props?.setpointC ?? 22) + 0.5 } }, "Setpoint raised")}>Setpoint +</Button>
          </div>
          {device.props?.schedule ? <p className="mt-2 text-xs text-zinc-500">Schedule {device.props.schedule.join(", ")}</p> : null}
          {people === 0 && device.props?.mode === "comfort" ? <p className="mt-2 text-sm text-violet-500">Recommendation: switch to Eco. The room is empty and the price does not justify comfort mode.</p> : null}
        </div>
      )}
      {device.type === "water_heater" && (
        <div className="space-y-2 text-sm">
          <Field label="Temperature" value={`${device.props?.currentTempC ?? "—"}°C`} />
          <Field label="Target" value={`${device.props?.targetTempC ?? "—"}°C`} />
          <Field label="Energy today" value={formatEnergy(device.props?.energyTodayKwh ?? 0)} />
          <Field label="Schedule" value={device.props?.schedule?.join(" · ") ?? "—"} />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => run({ props: { targetTempC: (device.props?.targetTempC ?? 60) - 1 } }, "Target lowered")}>Target −</Button>
            <Button size="sm" variant="outline" onClick={() => run({ props: { targetTempC: (device.props?.targetTempC ?? 60) + 1 } }, "Target raised")}>Target +</Button>
          </div>
          <p className="text-sm text-violet-500">Optimization: shift heating to the lower-cost morning window.</p>
        </div>
      )}
      {device.type === "lighting" && people === 0 && device.state === "on" ? <p className="text-sm text-violet-500">Occupancy is zero. This light can be turned off.</p> : null}
      {device.type === "computer" && people === 0 && device.state === "on" ? <p className="text-sm text-violet-500">No occupant is using this computer. Remote shutdown is available.</p> : null}
      {device.type === "smart_plug" ? <p className="text-xs text-zinc-500">Category {device.props?.plugCategory ?? "Unassigned"} · today {formatEnergy(device.props?.energyTodayKwh ?? 0)}</p> : null}
    </div>
  );
}

export function MonitoringPanel({ device }: { device: Device }) {
  if (device.type !== "elevator") return null;
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <Field label="State" value={device.state === "on" ? "In service" : "Idle"} />
      <Field label="Power" value={formatPower(devicePower(device))} />
      <Field label="Trips today" value={String(device.props?.tripsToday ?? 0)} />
      <Field label="Daily energy" value={formatEnergy(device.props?.energyTodayKwh ?? 0)} />
      <Field label="Peak" value={formatPower(device.props?.peakKw ?? 0)} />
      <Field label="Control" value="Monitoring only" />
    </dl>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

export function deviceKind(device: Device): string {
  return deviceTypeLabel(device.type);
}
