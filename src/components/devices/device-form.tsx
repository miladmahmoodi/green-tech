"use client";

import { controlClass, Field, FormActions } from "@/components/configuration/form";
import { Dialog } from "@/components/ui/dialog";
import { deviceTypeLabel } from "@/lib/format";
import type { EnergySnapshot } from "@/lib/engine/model";
import type { ControlMode, Device, DeviceType } from "@/types/energy";

export interface DeviceDraft {
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

export function blankDeviceDraft(snapshot: EnergySnapshot, type?: string): DeviceDraft | null {
  const building = snapshot.buildings[0];
  const floor = snapshot.floors.find((item) => item.buildingId === building?.id);
  const room = snapshot.rooms.find((item) => item.floorId === floor?.id);
  if (!building || !floor || !room) return null;
  return {
    id: `device-${Date.now()}`,
    name: "",
    type: type && snapshot.deviceTypes.some((item) => item.id === type) ? type : (snapshot.deviceTypes[0]?.id ?? "lighting"),
    buildingId: building.id,
    floorId: floor.id,
    roomId: room.id,
    controlMode: "automatic",
    controllable: true,
    existing: null,
  };
}

export function deviceFromDraft(draft: DeviceDraft, now: string): Device {
  return {
    id: draft.id,
    name: draft.name.trim(),
    type: draft.type as DeviceType,
    buildingId: draft.buildingId,
    floorId: draft.floorId,
    roomId: draft.roomId,
    status: draft.existing?.status ?? "connected",
    controlMode: draft.controllable ? draft.controlMode : "manual",
    controllable: draft.controllable,
    state: draft.existing?.state ?? "off",
    powerKw: draft.existing?.powerKw ?? 0,
    lastSeen: draft.existing?.lastSeen ?? now,
    props: draft.existing?.props ?? { ratedPowerKw: 0.1 },
  };
}

export function DeviceDialog({
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
