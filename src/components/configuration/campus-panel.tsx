"use client";

import { ConfirmDialog, controlClass, Field, FormActions } from "@/components/configuration/form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useEnergy } from "@/components/energy/use-energy";
import { useEnergyStore } from "@/lib/engine/store";
import type { Building, Floor, GeoPoint, Room, ZoneType } from "@/types/energy";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const CampusMap = dynamic(() => import("@/components/configuration/campus-map").then((mod) => mod.CampusMap), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-900" />,
});

const ZONES: ZoneType[] = ["lab", "classroom", "office", "administration", "common", "restroom", "library", "plant", "elevator"];

type Tool = "campus" | "building" | null;

function zoneLabel(zone: string): string {
  return zone.replaceAll("_", " ");
}

export function CampusPanel() {
  const { snapshot } = useEnergy();
  const updateCampus = useEnergyStore((state) => state.updateCampus);
  const upsertBuilding = useEnergyStore((state) => state.upsertBuilding);
  const removeBuilding = useEnergyStore((state) => state.removeBuilding);
  const upsertFloor = useEnergyStore((state) => state.upsertFloor);
  const removeFloor = useEnergyStore((state) => state.removeFloor);
  const upsertRoom = useEnergyStore((state) => state.upsertRoom);
  const removeRoom = useEnergyStore((state) => state.removeRoom);

  const [tool, setTool] = useState<Tool>(null);
  const [campusOpen, setCampusOpen] = useState(false);
  const [campusPoint, setCampusPoint] = useState<GeoPoint | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => void } | null>(null);

  const mapBuildings = useMemo(() => {
    if (!building) return snapshot.buildings;
    return snapshot.buildings.some((item) => item.id === building.id)
      ? snapshot.buildings.map((item) => (item.id === building.id ? building : item))
      : [...snapshot.buildings, building];
  }, [building, snapshot.buildings]);

  const openCampus = (point: GeoPoint | null) => {
    setCampusPoint(point ?? snapshot.campus.location);
    setCampusOpen(true);
    setTool(null);
  };

  const openBuilding = (next: Building) => {
    setBuilding(next);
    setFloor(null);
    setRoom(null);
    setTool(null);
  };

  const place = (point: GeoPoint) => {
    if (tool === "campus") {
      openCampus(point);
      return;
    }
    if (tool === "building") {
      openBuilding({
        id: `building-${Date.now()}`,
        campusId: snapshot.campus.id,
        name: "",
        code: "",
        baseloadKw: 0,
        areaM2: 0,
        location: point,
      });
    }
  };

  const saveBuilding = (next: Building) => {
    if (!next.name.trim() || !next.code.trim()) {
      toast.error("Building name and code are required");
      return false;
    }
    const saved = { ...next, name: next.name.trim(), code: next.code.trim().toUpperCase() };
    upsertBuilding(saved);
    setBuilding(saved);
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={tool === "campus" ? "default" : "outline"} onClick={() => setTool(tool === "campus" ? null : "campus")}>
          Place campus pin
        </Button>
        <Button type="button" variant={tool === "building" ? "default" : "outline"} onClick={() => setTool(tool === "building" ? null : "building")}>
          Place building pin
        </Button>
        <p className="text-sm text-zinc-500">
          {tool === "campus" ? "Click the map to set the campus marker." : tool === "building" ? "Click the map to add a building." : "Click a marker to edit it. Violet is the campus, green is a building."}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <CampusMap
          campus={snapshot.campus}
          buildings={mapBuildings}
          campusDraft={campusOpen ? campusPoint : null}
          placing={tool !== null}
          onMapClick={place}
          onCampusClick={() => openCampus(snapshot.campus.location)}
          onBuildingClick={openBuilding}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <button type="button" onClick={() => openCampus(snapshot.campus.location)} className="rounded-xl border border-zinc-200 p-4 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900">
          <p className="text-xs uppercase tracking-wide text-violet-500">Campus</p>
          <p className="mt-1 font-medium">{snapshot.campus.name}</p>
          <p className="text-sm text-zinc-500">{snapshot.campus.city} · {snapshot.campus.timezone}</p>
        </button>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-emerald-500">Buildings</p>
          <ul className="mt-2 space-y-1">
            {snapshot.buildings.map((item) => (
              <li key={item.id}>
                <button type="button" className="text-sm hover:underline" onClick={() => openBuilding(item)}>
                  {item.name} · {item.code}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <CampusDialog
        open={campusOpen}
        campusName={snapshot.campus.name}
        city={snapshot.campus.city}
        timezone={snapshot.campus.timezone}
        baselinePowerKw={snapshot.campus.baselinePowerKw}
        todayEnergyKwh={snapshot.campus.todayEnergyKwh}
        co2KgPerKwh={snapshot.campus.co2KgPerKwh}
        point={campusPoint}
        onOpenChange={setCampusOpen}
        onSave={(patch) => {
          updateCampus(patch);
          toast.success("Campus saved");
          setCampusOpen(false);
        }}
      />

      <BuildingDialog
        building={building}
        floors={snapshot.floors.filter((item) => item.buildingId === building?.id)}
        onChange={setBuilding}
        onClose={() => {
          setBuilding(null);
          setFloor(null);
          setRoom(null);
        }}
        onSave={(next) => {
          if (!saveBuilding(next)) return;
          toast.success("Building saved");
          setBuilding(null);
        }}
        onDelete={() => {
          if (!building) return;
          setConfirm({
            title: `Delete ${building.name || "building"}?`,
            body: "Floors and rooms in this building are removed with it. Devices must be moved first.",
            run: () => {
              const error = removeBuilding(building.id);
              if (error) toast.error(error);
              else {
                toast.success("Building deleted");
                setBuilding(null);
              }
            },
          });
        }}
        onOpenFloor={(next) => {
          if (!building || !saveBuilding(building)) return;
          setFloor(next);
        }}
      />

      <FloorDialog
        floor={floor}
        rooms={snapshot.rooms.filter((item) => item.floorId === floor?.id)}
        onChange={setFloor}
        onClose={() => {
          setFloor(null);
          setRoom(null);
        }}
        onSave={(next) => {
          if (!next.name.trim()) {
            toast.error("Floor name is required");
            return;
          }
          upsertFloor({ ...next, name: next.name.trim() });
          toast.success("Floor saved");
          setFloor(null);
        }}
        onDelete={() => {
          if (!floor) return;
          setConfirm({
            title: `Delete ${floor.name || "floor"}?`,
            body: "Rooms on this floor are removed with it. Devices must be moved first.",
            run: () => {
              const error = removeFloor(floor.id);
              if (error) toast.error(error);
              else {
                toast.success("Floor deleted");
                setFloor(null);
              }
            },
          });
        }}
        onOpenRoom={(next) => {
          if (!floor || !floor.name.trim()) {
            toast.error("Save the floor name first");
            return;
          }
          upsertFloor({ ...floor, name: floor.name.trim() });
          setFloor({ ...floor, name: floor.name.trim() });
          setRoom(next);
        }}
      />

      <RoomDialog
        room={room}
        onChange={setRoom}
        onClose={() => setRoom(null)}
        onSave={(next) => {
          if (!next.name.trim()) {
            toast.error("Room name is required");
            return;
          }
          upsertRoom({ ...next, name: next.name.trim() });
          toast.success("Room saved");
          setRoom(null);
        }}
        onDelete={() => {
          if (!room) return;
          setConfirm({
            title: `Delete ${room.name || "room"}?`,
            body: "Devices in this room must be moved before it can be deleted.",
            run: () => {
              const error = removeRoom(room.id);
              if (error) toast.error(error);
              else {
                toast.success("Room deleted");
                setRoom(null);
              }
            },
          });
        }}
      />

      <ConfirmDialog open={confirm !== null} title={confirm?.title ?? "Confirm"} body={confirm?.body ?? ""} onOpenChange={(open) => !open && setConfirm(null)} onConfirm={() => confirm?.run()} />
    </div>
  );
}

function CampusDialog({
  open,
  campusName,
  city,
  timezone,
  baselinePowerKw,
  todayEnergyKwh,
  co2KgPerKwh,
  point,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  campusName: string;
  city: string;
  timezone: string;
  baselinePowerKw: number;
  todayEnergyKwh: number;
  co2KgPerKwh: number;
  point: GeoPoint | null;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: { name: string; city: string; timezone: string; location: GeoPoint; baselinePowerKw: number; todayEnergyKwh: number; co2KgPerKwh: number }) => void;
}) {
  const [name, setName] = useState(campusName);
  const [cityValue, setCityValue] = useState(city);
  const [timezoneValue, setTimezoneValue] = useState(timezone);
  const [baseline, setBaseline] = useState(String(baselinePowerKw));
  const [energy, setEnergy] = useState(String(todayEnergyKwh));
  const [co2, setCo2] = useState(String(co2KgPerKwh));

  useEffect(() => {
    if (!open) return;
    setName(campusName);
    setCityValue(city);
    setTimezoneValue(timezone);
    setBaseline(String(baselinePowerKw));
    setEnergy(String(todayEnergyKwh));
    setCo2(String(co2KgPerKwh));
  }, [open, campusName, city, timezone, baselinePowerKw, todayEnergyKwh, co2KgPerKwh]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Campus"
      description="Name, place, and campus energy settings."
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            toast.error("Campus name is required");
            return;
          }
          if (!point) {
            toast.error("Place the campus pin on the map first");
            return;
          }
          onSave({
            name: name.trim(),
            city: cityValue.trim(),
            timezone: timezoneValue.trim(),
            location: point,
            baselinePowerKw: Number(baseline) || 0,
            todayEnergyKwh: Number(energy) || 0,
            co2KgPerKwh: Number(co2) || 0,
          });
        }}
      >
        <Field label="Name"><input aria-label="Campus name" className={controlClass} value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="City"><input aria-label="City" className={controlClass} value={cityValue} onChange={(event) => setCityValue(event.target.value)} /></Field>
        <Field label="Timezone"><input aria-label="Timezone" className={controlClass} value={timezoneValue} onChange={(event) => setTimezoneValue(event.target.value)} /></Field>
        <Field label="Baseline kW"><input aria-label="Baseline power" className={controlClass} type="number" step="0.1" value={baseline} onChange={(event) => setBaseline(event.target.value)} /></Field>
        <Field label="Today energy kWh"><input aria-label="Today energy" className={controlClass} type="number" step="0.1" value={energy} onChange={(event) => setEnergy(event.target.value)} /></Field>
        <Field label="CO₂ kg/kWh"><input aria-label="CO2 factor" className={controlClass} type="number" step="0.001" value={co2} onChange={(event) => setCo2(event.target.value)} /></Field>
        <Field label="Latitude"><input aria-label="Latitude" className={controlClass} value={point ? point.lat.toFixed(5) : ""} readOnly /></Field>
        <Field label="Longitude"><input aria-label="Longitude" className={controlClass} value={point ? point.lng.toFixed(5) : ""} readOnly /></Field>
        <div className="sm:col-span-2">
          <FormActions onCancel={() => onOpenChange(false)} />
        </div>
      </form>
    </Dialog>
  );
}

function BuildingDialog({
  building,
  floors,
  onChange,
  onClose,
  onSave,
  onDelete,
  onOpenFloor,
}: {
  building: Building | null;
  floors: Floor[];
  onChange: (building: Building) => void;
  onClose: () => void;
  onSave: (building: Building) => void;
  onDelete: () => void;
  onOpenFloor: (floor: Floor) => void;
}) {
  if (!building) return null;
  const nextLevel = floors.reduce((max, item) => Math.max(max, item.level), 0) + 1;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={building.name || "New building"} description="Building details and floors. Open a floor to add rooms and zones." wide>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(building);
        }}
      >
        <Field label="Name"><input aria-label="Building name" className={controlClass} value={building.name} onChange={(event) => onChange({ ...building, name: event.target.value })} /></Field>
        <Field label="Code"><input aria-label="Building code" className={controlClass} value={building.code} onChange={(event) => onChange({ ...building, code: event.target.value })} /></Field>
        <Field label="Area m²"><input aria-label="Area" className={controlClass} type="number" step="1" value={building.areaM2} onChange={(event) => onChange({ ...building, areaM2: Number(event.target.value) || 0 })} /></Field>
        <Field label="Baseload kW"><input aria-label="Baseload" className={controlClass} type="number" step="0.1" value={building.baseloadKw} onChange={(event) => onChange({ ...building, baseloadKw: Number(event.target.value) || 0 })} /></Field>
        <Field label="Latitude"><input aria-label="Building latitude" className={controlClass} value={building.location?.lat.toFixed(5) ?? ""} readOnly /></Field>
        <Field label="Longitude"><input aria-label="Building longitude" className={controlClass} value={building.location?.lng.toFixed(5) ?? ""} readOnly /></Field>
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">Floors</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onOpenFloor({
                  id: `floor-${Date.now()}`,
                  buildingId: building.id,
                  name: `Floor ${nextLevel}`,
                  level: nextLevel,
                })
              }
            >
              Add floor
            </Button>
          </div>
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {floors.length === 0 ? <li className="px-3 py-2 text-sm text-zinc-500">No floors yet.</li> : null}
            {floors.map((item) => (
              <li key={item.id}>
                <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900" onClick={() => onOpenFloor(item)}>
                  <span>{item.name}</span>
                  <span className="text-zinc-500">Level {item.level}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="sm:col-span-2">
          <FormActions onCancel={onClose} onDelete={snapshotHas(building.id) ? onDelete : undefined} />
        </div>
      </form>
    </Dialog>
  );
}

function snapshotHas(id: string): boolean {
  return useEnergyStore.getState().buildings.some((item) => item.id === id);
}

function FloorDialog({
  floor,
  rooms,
  onChange,
  onClose,
  onSave,
  onDelete,
  onOpenRoom,
}: {
  floor: Floor | null;
  rooms: Room[];
  onChange: (floor: Floor) => void;
  onClose: () => void;
  onSave: (floor: Floor) => void;
  onDelete: () => void;
  onOpenRoom: (room: Room) => void;
}) {
  if (!floor) return null;
  const saved = useEnergyStore.getState().floors.some((item) => item.id === floor.id);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={floor.name || "New floor"} description="Floor details, then rooms and zones." wide>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(floor);
        }}
      >
        <Field label="Name"><input aria-label="Floor name" className={controlClass} value={floor.name} onChange={(event) => onChange({ ...floor, name: event.target.value })} /></Field>
        <Field label="Level"><input aria-label="Floor level" className={controlClass} type="number" step="1" value={floor.level} onChange={(event) => onChange({ ...floor, level: Number(event.target.value) || 0 })} /></Field>
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">Rooms and zones</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onOpenRoom({
                  id: `room-${Date.now()}`,
                  floorId: floor.id,
                  buildingId: floor.buildingId,
                  name: "",
                  zoneType: "office",
                  areaM2: 0,
                  capacity: 0,
                })
              }
            >
              Add room
            </Button>
          </div>
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {rooms.length === 0 ? <li className="px-3 py-2 text-sm text-zinc-500">No rooms yet.</li> : null}
            {rooms.map((item) => (
              <li key={item.id}>
                <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900" onClick={() => onOpenRoom(item)}>
                  <span>{item.name}</span>
                  <span className="capitalize text-zinc-500">{zoneLabel(item.zoneType)} · {item.capacity} people</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="sm:col-span-2">
          <FormActions onCancel={onClose} onDelete={saved ? onDelete : undefined} />
        </div>
      </form>
    </Dialog>
  );
}

function RoomDialog({
  room,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  room: Room | null;
  onChange: (room: Room) => void;
  onClose: () => void;
  onSave: (room: Room) => void;
  onDelete: () => void;
}) {
  if (!room) return null;
  const saved = useEnergyStore.getState().rooms.some((item) => item.id === room.id);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()} title={room.name || "New room"} description="Room name, zone, area, and capacity.">
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(room);
        }}
      >
        <Field label="Name"><input aria-label="Room name" className={controlClass} value={room.name} onChange={(event) => onChange({ ...room, name: event.target.value })} /></Field>
        <Field label="Zone">
          <select aria-label="Zone" className={controlClass} value={room.zoneType} onChange={(event) => onChange({ ...room, zoneType: event.target.value as ZoneType })}>
            {ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zoneLabel(zone)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Area m²"><input aria-label="Room area" className={controlClass} type="number" step="1" value={room.areaM2} onChange={(event) => onChange({ ...room, areaM2: Number(event.target.value) || 0 })} /></Field>
        <Field label="Capacity"><input aria-label="Capacity" className={controlClass} type="number" step="1" value={room.capacity} onChange={(event) => onChange({ ...room, capacity: Number(event.target.value) || 0 })} /></Field>
        <div className="sm:col-span-2">
          <FormActions onCancel={onClose} onDelete={saved ? onDelete : undefined} />
        </div>
      </form>
    </Dialog>
  );
}
