"use client";

import { ConfirmDialog, controlClass, Field, FormActions, RecordTable } from "@/components/configuration/form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useEnergy } from "@/components/energy/use-energy";
import { deviceTypeLabel } from "@/lib/format";
import { useEnergyStore } from "@/lib/engine/store";
import type { ControlMode, Device, DeviceType } from "@/types/energy";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface DeviceDraft {
  id: string;
  name: string;
  type: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  controlMode: ControlMode;
  controllable: boolean;
  existing: Device | null;
}

export function DevicesPanel() {
  const { snapshot } = useEnergy();
  const addDevice = useEnergyStore((state) => state.addDevice);
  const replaceDevice = useEnergyStore((state) => state.replaceDevice);
  const removeDevice = useEnergyStore((state) => state.removeDevice);
  const [draft, setDraft] = useState<DeviceDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Device | null>(null);

  const roomName = useMemo(() => new Map(snapshot.rooms.map((room) => [room.id, room.name])), [snapshot.rooms]);

  const openCreate = () => {
    const building = snapshot.buildings[0];
    const floor = snapshot.floors.find((item) => item.buildingId === building?.id);
    const room = snapshot.rooms.find((item) => item.floorId === floor?.id);
    if (!building || !floor || !room) {
      toast.error("Add a building, floor, and room on the campus map first");
      return;
    }
    setDraft({
      id: `device-${Date.now()}`,
      name: "",
      type: snapshot.deviceTypes[0]?.id ?? "lighting",
      buildingId: building.id,
      floorId: floor.id,
      roomId: room.id,
      controlMode: "automatic",
      controllable: true,
      existing: null,
    });
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
          const device: Device = {
            id: next.id,
            name: next.name.trim(),
            type: next.type as DeviceType,
            buildingId: next.buildingId,
            floorId: next.floorId,
            roomId: next.roomId,
            status: next.existing?.status ?? "connected",
            controlMode: next.controllable ? next.controlMode : "manual",
            controllable: next.controllable,
            state: next.existing?.state ?? "off",
            powerKw: next.existing?.powerKw ?? 0,
            lastSeen: next.existing?.lastSeen ?? snapshot.demoNow,
            props: next.existing?.props ?? { ratedPowerKw: 0.1 },
          };
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

function DeviceDialog({
  draft,
  buildings,
  floors,
  rooms,
  types,
  onChange,
  onClose,
  onSave,
}: {
  draft: DeviceDraft | null;
  buildings: { id: string; name: string }[];
  floors: { id: string; buildingId: string; name: string }[];
  rooms: { id: string; floorId: string; name: string }[];
  types: { id: string; label: string }[];
  onChange: (draft: DeviceDraft) => void;
  onClose: () => void;
  onSave: (draft: DeviceDraft) => void;
}) {
  if (!draft) return null;
  const floorOptions = floors.filter((floor) => floor.buildingId === draft.buildingId);
  const roomOptions = rooms.filter((room) => room.floorId === draft.floorId);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={draft.existing ? "Edit device" : "Add device"} description="Location, type, and control." wide>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <Field label="Building">
          <select
            aria-label="Building"
            className={controlClass}
            value={draft.buildingId}
            onChange={(event) => {
              const buildingId = event.target.value;
              const floor = floors.find((item) => item.buildingId === buildingId);
              const room = rooms.find((item) => item.floorId === floor?.id);
              onChange({ ...draft, buildingId, floorId: floor?.id ?? "", roomId: room?.id ?? "" });
            }}
          >
            {buildings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Floor">
          <select
            aria-label="Floor"
            className={controlClass}
            value={draft.floorId}
            onChange={(event) => {
              const floorId = event.target.value;
              const room = rooms.find((item) => item.floorId === floorId);
              onChange({ ...draft, floorId, roomId: room?.id ?? "" });
            }}
          >
            {floorOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Room">
          <select aria-label="Room" className={controlClass} value={draft.roomId} onChange={(event) => onChange({ ...draft, roomId: event.target.value })}>
            {roomOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Device name">
          <input aria-label="Device name" className={controlClass} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
        </Field>
        <Field label="Device type">
          <select aria-label="Device type" className={controlClass} value={draft.type} onChange={(event) => onChange({ ...draft, type: event.target.value })}>
            {types.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Control mode">
          <select aria-label="Control mode" className={controlClass} value={draft.controlMode} onChange={(event) => onChange({ ...draft, controlMode: event.target.value as ControlMode })}>
            <option value="automatic">Automatic</option>
            <option value="scheduled">Scheduled</option>
            <option value="manual">Manual</option>
          </select>
        </Field>
        <Field label="Control capability">
          <select aria-label="Control capability" className={controlClass} value={draft.controllable ? "remote" : "local"} onChange={(event) => onChange({ ...draft, controllable: event.target.value === "remote" })}>
            <option value="remote">Remote</option>
            <option value="local">Local / manual</option>
          </select>
        </Field>
        <Field label="Energy category">
          <input aria-label="Energy category" className={controlClass} value={types.find((item) => item.id === draft.type)?.label ?? deviceTypeLabel(draft.type)} readOnly />
        </Field>
        <div className="md:col-span-2">
          <FormActions onCancel={onClose} saveLabel={draft.existing ? "Save changes" : "Add device"} />
        </div>
      </form>
    </Dialog>
  );
}
