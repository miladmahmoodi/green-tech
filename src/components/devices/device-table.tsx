"use client";

import { ConnectivityBadge, ControlModeBadge, DeviceStateBadge } from "@/components/devices/badges";
import { blankDeviceDraft, deviceFromDraft, DeviceDialog, type DeviceDraft } from "@/components/devices/device-form";
import { Button } from "@/components/ui/button";
import { deviceLocation, devicePower } from "@/lib/engine/model";
import { useEnergyStore } from "@/lib/engine/store";
import { deviceTypeLabel, formatAgo, formatPower } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnergySnapshot } from "@/lib/engine/model";
import type { Device, DeviceType } from "@/types/energy";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function DeviceTable({ snapshot, onSelect }: { snapshot: EnergySnapshot; onSelect: (id: string) => void }) {
  const highlighted = useEnergyStore((state) => state.highlight) === "device-table";
  const addDevice = useEnergyStore((state) => state.addDevice);
  const [draft, setDraft] = useState<DeviceDraft | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DeviceType | "all">("all");
  const [status, setStatus] = useState("all");
  const data = useMemo(
    () => snapshot.devices.filter((device) => (type === "all" || device.type === type) && (status === "all" || device.status === status) && (`${device.name} ${deviceLocation(snapshot, device)}`).toLowerCase().includes(query.toLowerCase())),
    [snapshot, query, type, status],
  );
  const columns = useMemo<ColumnDef<Device>[]>(() => [
    { accessorKey: "name", header: "Device" },
    { id: "location", header: "Location", accessorFn: (device) => deviceLocation(snapshot, device) },
    { id: "type", header: "Type", accessorFn: (device) => deviceTypeLabel(device.type) },
    { id: "power", header: "Power", accessorFn: (device) => devicePower(device) },
    { accessorKey: "state", header: "Status" },
    { accessorKey: "status", header: "Connectivity" },
    { accessorKey: "controlMode", header: "Control mode" },
    { id: "seen", header: "Last seen", accessorFn: (device) => device.lastSeen },
  ], [snapshot]);
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  return (
    <div id="device-table" className={cn("space-y-3", highlighted && "rounded-xl ring-2 ring-violet-500")}>
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search devices" aria-label="Search devices" className="h-9 rounded-lg border border-zinc-300 bg-transparent px-3 text-sm dark:border-zinc-700" />
        <select value={type} onChange={(event) => setType(event.target.value as DeviceType | "all")} aria-label="Filter by type" className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="all">All types</option>
          {["lighting", "hvac", "heating", "cooling", "computer", "smart_plug", "water_heater", "elevator", "electricity_meter", "solar_panel", "solar_inverter", "battery"].map((item) => <option key={item} value={item}>{deviceTypeLabel(item)}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by connectivity" className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700">
          <option value="all">All links</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="error">Error</option>
          <option value="unknown">Unknown</option>
        </select>
        <Button
          type="button"
          className="ml-auto"
          onClick={() => {
            const next = blankDeviceDraft(snapshot, type === "all" ? undefined : type);
            if (!next) {
              toast.error("Add a building, floor, and room on the campus map first");
              return;
            }
            setDraft(next);
          }}
        >
          Add device
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-zinc-500">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-zinc-200 dark:border-zinc-800">
                {group.headers.map((header) => <th key={header.id} className="px-3 py-2 font-medium">{String(header.column.columnDef.header)}</th>)}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} tabIndex={0} className="cursor-pointer border-b border-zinc-100 text-[13px] outline-none hover:bg-zinc-50 focus-visible:bg-violet-500/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 dark:border-zinc-800/80 dark:hover:bg-zinc-800/50" onClick={() => onSelect(row.original.id)} onKeyDown={(event) => { if (event.key === "Enter") onSelect(row.original.id); }}>
                <td className="px-3 py-2 font-medium">{row.original.name}</td>
                <td className="px-3 py-2 text-zinc-500">{deviceLocation(snapshot, row.original)}</td>
                <td className="px-3 py-2">{deviceTypeLabel(row.original.type)}</td>
                <td className="num px-3 py-2">{formatPower(devicePower(row.original))}</td>
                <td className="px-3 py-2"><DeviceStateBadge state={row.original.state} /></td>
                <td className="px-3 py-2"><ConnectivityBadge status={row.original.status} /></td>
                <td className="px-3 py-2"><ControlModeBadge mode={row.original.controlMode} /></td>
                <td className="px-3 py-2 text-zinc-500">{formatAgo(row.original.lastSeen, snapshot.demoNow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">{data.length} devices</p>
      <DeviceDialog
        draft={draft}
        buildings={snapshot.buildings}
        floors={snapshot.floors}
        rooms={snapshot.rooms}
        types={snapshot.deviceTypes}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSave={(next) => {
          if (!next.name.trim()) {
            toast.error("Device name is required");
            return;
          }
          if (!next.roomId) {
            toast.error("Choose a room");
            return;
          }
          addDevice(deviceFromDraft(next, snapshot.demoNow));
          toast.success("Device added");
          setDraft(null);
        }}
      />
    </div>
  );
}
