"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnergy } from "@/components/energy/use-energy";
import { catalogSchedules } from "@/lib/engine/views";
import { useEnergyStore } from "@/lib/engine/store";
import { deviceTypeLabel } from "@/lib/format";
import type { ControlMode, Device, DeviceType } from "@/types/energy";
import { useState } from "react";
import { toast } from "sonner";

const TYPES: DeviceType[] = ["lighting", "hvac", "heating", "cooling", "computer", "smart_plug", "water_heater", "elevator", "electricity_meter", "solar_panel", "solar_inverter", "battery"];

export default function ConfigurationPage() {
  const { snapshot } = useEnergy();
  const addDevice = useEnergyStore((state) => state.addDevice);
  const updatePrices = useEnergyStore((state) => state.updatePrices);
  const [form, setForm] = useState({ buildingId: "main-building", floorId: "main-floor-2", roomId: "lab-204", name: "", type: "lighting" as DeviceType, controlMode: "automatic" as ControlMode, controllable: true });
  const floors = snapshot.floors.filter((floor) => floor.buildingId === form.buildingId);
  const rooms = snapshot.rooms.filter((room) => room.floorId === form.floorId);

  const create = () => {
    if (!form.name.trim()) {
      toast.error("Device name is required");
      return;
    }
    const device: Device = {
      id: `device-${Date.now()}`,
      name: form.name.trim(),
      type: form.type,
      buildingId: form.buildingId,
      floorId: form.floorId,
      roomId: form.roomId,
      status: "connected",
      controlMode: form.controllable ? form.controlMode : "manual",
      controllable: form.controllable,
      state: "off",
      powerKw: 0,
      lastSeen: snapshot.demoNow,
      props: { ratedPowerKw: 0.1 },
    };
    addDevice(device);
    toast.success("Device added to the runtime model");
    setForm((current) => ({ ...current, name: "" }));
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium">Configuration</h1>
        <p className="text-sm text-zinc-500">Edits stay in memory. Reset demo reloads the JSON files.</p>
      </header>
      <Tabs defaultValue="devices">
        <TabsList>
          {["campus", "buildings", "floors", "rooms", "devices", "types", "tariffs", "schedules", "occupancy", "policies", "targets", "solar", "battery", "security"].map((tab) => (
            <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="campus" className="pt-4"><Entity rows={[[snapshot.campus.name, snapshot.campus.city, snapshot.campus.timezone]]} columns={["Campus", "City", "Timezone"]} /></TabsContent>
        <TabsContent value="buildings" className="pt-4"><Entity columns={["Building", "Code", "Baseload kW", "Area"]} rows={snapshot.buildings.map((item) => [item.name, item.code, String(item.baseloadKw), String(item.areaM2)])} /></TabsContent>
        <TabsContent value="floors" className="pt-4"><Entity columns={["Floor", "Building", "Level"]} rows={snapshot.floors.map((item) => [item.name, item.buildingId, String(item.level)])} /></TabsContent>
        <TabsContent value="rooms" className="pt-4"><Entity columns={["Room", "Zone", "Capacity"]} rows={snapshot.rooms.map((item) => [item.name, item.zoneType, String(item.capacity)])} /></TabsContent>
        <TabsContent value="devices" className="space-y-4 pt-4">
          <Card className="grid gap-3 p-4 md:grid-cols-3">
            <Field label="Building"><select aria-label="Building" value={form.buildingId} onChange={(event) => setForm({ ...form, buildingId: event.target.value })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">{snapshot.buildings.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Floor"><select aria-label="Floor" value={form.floorId} onChange={(event) => setForm({ ...form, floorId: event.target.value })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">{floors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Room"><select aria-label="Room" value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">{rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
            <Field label="Device name"><input aria-label="Device name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700" /></Field>
            <Field label="Device type"><select aria-label="Device type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as DeviceType })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">{TYPES.map((item) => <option key={item} value={item}>{deviceTypeLabel(item)}</option>)}</select></Field>
            <Field label="Control mode"><select aria-label="Control mode" value={form.controlMode} onChange={(event) => setForm({ ...form, controlMode: event.target.value as ControlMode })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700"><option value="automatic">Automatic</option><option value="scheduled">Scheduled</option><option value="manual">Manual</option></select></Field>
            <Field label="Control capability"><select aria-label="Control capability" value={form.controllable ? "remote" : "local"} onChange={(event) => setForm({ ...form, controllable: event.target.value === "remote" })} className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700"><option value="remote">Remote</option><option value="local">Local / manual</option></select></Field>
            <Field label="IoT connection"><input aria-label="IoT connection" value="Campus gateway" readOnly className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700" /></Field>
            <Field label="Energy category"><input aria-label="Energy category" value={deviceTypeLabel(form.type)} readOnly className="h-9 w-full rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700" /></Field>
            <div className="flex items-end"><Button onClick={create}>Add device</Button></div>
          </Card>
          <Entity columns={["Device", "Type", "Room"]} rows={snapshot.devices.slice(0, 12).map((device) => [device.name, deviceTypeLabel(device.type), device.roomId])} />
        </TabsContent>
        <TabsContent value="types" className="pt-4"><Entity columns={["Type"]} rows={TYPES.map((type) => [deviceTypeLabel(type)])} /></TabsContent>
        <TabsContent value="tariffs" className="space-y-3 pt-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-3">
            <Field label="Current $/kWh"><input aria-label="Current price" defaultValue={snapshot.prices.currentUsdPerKwh} type="number" step="0.01" onBlur={(event) => updatePrices({ currentUsdPerKwh: Number(event.target.value) })} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700" /></Field>
            <Field label="Off-peak"><p className="num text-sm">${snapshot.prices.offPeakUsdPerKwh.toFixed(2)}</p></Field>
            <Field label="Peak window"><p className="text-sm">{snapshot.prices.peakWindow} · ${snapshot.prices.peakUsdPerKwh.toFixed(2)}</p></Field>
          </Card>
        </TabsContent>
        <TabsContent value="schedules" className="pt-4"><Entity columns={["Schedule", "Scope", "Windows"]} rows={catalogSchedules().map((item) => [item.name, item.scope, item.windows.join(", ")])} /></TabsContent>
        <TabsContent value="occupancy" className="pt-4"><Entity columns={["Room", "People", "Capacity"]} rows={snapshot.occupancy.map((item) => [item.roomId, String(item.people), String(item.capacity)])} /></TabsContent>
        <TabsContent value="policies" className="pt-4"><Entity columns={["Rule", "Enabled", "Priority"]} rows={snapshot.rules.map((rule) => [rule.name, rule.enabled ? "Yes" : "No", String(rule.priority)])} /></TabsContent>
        <TabsContent value="targets" className="pt-4"><Entity columns={["Target", "Value"]} rows={[["Baseline power", `${snapshot.campus.baselinePowerKw} kW`], ["Today energy", `${snapshot.campus.todayEnergyKwh} kWh`], ["CO₂ factor", `${snapshot.campus.co2KgPerKwh} kg/kWh`]]} /></TabsContent>
        <TabsContent value="solar" className="pt-4"><Entity columns={["Field", "Value"]} rows={[["Capacity", `${snapshot.solar.capacityKw} kW`], ["Output", `${snapshot.solar.currentKw} kW`], ["Inverter", snapshot.solar.inverterStatus]]} /></TabsContent>
        <TabsContent value="battery" className="pt-4"><Entity columns={["Field", "Value"]} rows={[["Capacity", `${snapshot.battery.capacityKwh} kWh`], ["SOC", `${snapshot.battery.soc}%`], ["Reserve", `${snapshot.battery.reserveSoc}%`], ["Power", `${snapshot.battery.powerKw} kW`]]} /></TabsContent>
        <TabsContent value="security" className="pt-4">
          <Card className="p-4">
            <h2 className="text-sm font-medium">Security systems are isolated from the energy control domain.</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-500">The energy network can meter and command loads. It has no route to cameras, locks, alarms, or access control.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-xl border border-emerald-500/40 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-500">Energy domain</p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>HVAC, lighting, computers</li>
                  <li>Smart plugs and water heating</li>
                  <li>Solar, battery, tariffs</li>
                </ul>
              </div>
              <p className="text-center text-xs uppercase tracking-[0.16em] text-zinc-500">No control path</p>
              <div className="rounded-xl border border-zinc-400 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Security domain</p>
                <ul className="mt-2 space-y-1 text-sm text-zinc-500">
                  <li>CCTV</li>
                  <li>Central locks</li>
                  <li>Intrusion alarms</li>
                  <li>Critical access control</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs text-zinc-500">{label}<span className="mt-1 block text-zinc-900 dark:text-zinc-100">{children}</span></label>;
}

function Entity({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-zinc-500"><tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("-")}`} className="border-t border-zinc-100 dark:border-zinc-800">
              {row.map((cell, index) => (
                <td key={columns[index] ?? index} className="px-3 py-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
