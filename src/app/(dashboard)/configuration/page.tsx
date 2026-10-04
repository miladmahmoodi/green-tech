"use client";

import { CampusPanel } from "@/components/configuration/campus-panel";
import { SchedulesPanel, TariffsPanel, TypesPanel } from "@/components/configuration/catalog-panels";
import { DevicesPanel } from "@/components/configuration/devices-panel";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnergy } from "@/components/energy/use-energy";

const TABS = [
  ["campus", "Campus"],
  ["devices", "Devices"],
  ["types", "Types"],
  ["tariffs", "Tariffs"],
  ["schedules", "Schedules"],
  ["occupancy", "Occupancy"],
  ["policies", "Policies"],
  ["targets", "Targets"],
  ["solar", "Solar"],
  ["battery", "Battery"],
  ["security", "Security"],
] as const;

export default function ConfigurationPage() {
  const { snapshot } = useEnergy();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-medium">Configuration</h1>
        <p className="text-sm text-zinc-500">Place the campus and buildings on the map. Edits stay in memory until the demo is reset.</p>
      </header>
      <Tabs defaultValue="campus">
        <TabsList>
          {TABS.map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="campus" className="pt-4">
          <CampusPanel />
        </TabsContent>
        <TabsContent value="devices" className="pt-4">
          <DevicesPanel />
        </TabsContent>
        <TabsContent value="types" className="pt-4">
          <TypesPanel />
        </TabsContent>
        <TabsContent value="tariffs" className="pt-4">
          <TariffsPanel />
        </TabsContent>
        <TabsContent value="schedules" className="pt-4">
          <SchedulesPanel />
        </TabsContent>
        <TabsContent value="occupancy" className="pt-4">
          <Entity columns={["Room", "People", "Capacity"]} rows={snapshot.occupancy.map((item) => [item.roomId, String(item.people), String(item.capacity)])} />
        </TabsContent>
        <TabsContent value="policies" className="pt-4">
          <Entity columns={["Rule", "Enabled", "Priority"]} rows={snapshot.rules.map((rule) => [rule.name, rule.enabled ? "Yes" : "No", String(rule.priority)])} />
        </TabsContent>
        <TabsContent value="targets" className="pt-4">
          <Entity columns={["Target", "Value"]} rows={[["Baseline power", `${snapshot.campus.baselinePowerKw} kW`], ["Today energy", `${snapshot.campus.todayEnergyKwh} kWh`], ["CO₂ factor", `${snapshot.campus.co2KgPerKwh} kg/kWh`]]} />
        </TabsContent>
        <TabsContent value="solar" className="pt-4">
          <Entity columns={["Field", "Value"]} rows={[["Capacity", `${snapshot.solar.capacityKw} kW`], ["Output", `${snapshot.solar.currentKw} kW`], ["Inverter", snapshot.solar.inverterStatus]]} />
        </TabsContent>
        <TabsContent value="battery" className="pt-4">
          <Entity columns={["Field", "Value"]} rows={[["Capacity", `${snapshot.battery.capacityKwh} kWh`], ["SOC", `${snapshot.battery.soc}%`], ["Reserve", `${snapshot.battery.reserveSoc}%`], ["Power", `${snapshot.battery.powerKw} kW`]]} />
        </TabsContent>
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

function Entity({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("-")}`} className="border-t border-zinc-100 dark:border-zinc-800">
              {row.map((cell, index) => (
                <td key={columns[index] ?? index} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
