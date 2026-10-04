"use client";

import { ConfirmDialog, RecordTable } from "@/components/configuration/form";
import { blankDeviceDraft, deviceFromDraft, DeviceDialog, type DeviceDraft } from "@/components/devices/device-form";
import { Button } from "@/components/ui/button";
import { useEnergy } from "@/components/energy/use-energy";
import { deviceTypeLabel } from "@/lib/format";
import { useEnergyStore } from "@/lib/engine/store";
import type { Device } from "@/types/energy";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function DevicesPanel() {
  const { snapshot } = useEnergy();
  const addDevice = useEnergyStore((state) => state.addDevice);
  const replaceDevice = useEnergyStore((state) => state.replaceDevice);
  const removeDevice = useEnergyStore((state) => state.removeDevice);
  const [draft, setDraft] = useState<DeviceDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Device | null>(null);

  const roomName = useMemo(() => new Map(snapshot.rooms.map((room) => [room.id, room.name])), [snapshot.rooms]);

  const openCreate = () => {
    const next = blankDeviceDraft(snapshot);
    if (!next) {
      toast.error("Add a building, floor, and room on the campus map first");
      return;
    }
    setDraft(next);
  };

  const openEdit = (device: Device) => {
    setDraft({
      id: device.id,
      name: device.name,
      type: device.type,
      buildingId: device.buildingId,
      floorId: device.floorId,
      roomId: device.roomId,
      controlMode: device.controlMode,
      controllable: device.controllable,
      existing: device,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          Add device
        </Button>
      </div>
      <RecordTable
        columns={["Device", "Type", "Room", ""]}
        rows={snapshot.devices.map((device) => [
          device.name,
          deviceTypeLabel(device.type),
          roomName.get(device.roomId) ?? device.roomId,
          <span key={device.id} className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => openEdit(device)}>
              Edit
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => setPendingDelete(device)}>
              Delete
            </Button>
          </span>,
        ])}
      />
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
          const device = deviceFromDraft(next, snapshot.demoNow);
          if (next.existing) replaceDevice(device);
          else addDevice(device);
          toast.success(next.existing ? "Device updated" : "Device added");
          setDraft(null);
        }}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "device"}?`}
        body="This removes the device from the runtime model."
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeDevice(pendingDelete.id);
          toast.success("Device deleted");
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
