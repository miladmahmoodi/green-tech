import { devicePower, type Derived, type EnergySnapshot } from "@/lib/engine/model";
import { activeInsights } from "@/lib/engine/views";
import { mockDataProvider } from "@/lib/mock-data";
import { LOAD_DEVICE_TYPES, type Device, type FloorPlan, type FloorPlanZone } from "@/types/energy";

export type ZoneVisualState = "normal" | "occupied" | "opportunity" | "anomaly" | "offline" | "optimized";

export type PlanMode = "energy" | "occupancy" | "optimization" | "health";

export interface ZoneLive {
  zone: FloorPlanZone;
  powerKw: number;
  expectedKw: number;
  people: number;
  capacity: number;
  state: ZoneVisualState;
  connected: number;
  warning: number;
  offline: number;
  temperatureC: number | null;
  hvacOn: boolean;
  hvacMode: string | null;
  lightsOn: number;
  lightsTotal: number;
  computersOn: number;
  insightId: string | null;
  insightText: string | null;
  dailySavingUsd: number;
  deviationPct: number;
}

const STATE_RANK: Record<ZoneVisualState, number> = {
  anomaly: 5,
  offline: 4,
  opportunity: 3,
  optimized: 2,
  occupied: 1,
  normal: 0,
};

export function worstState(states: ZoneVisualState[]): ZoneVisualState {
  return states.reduce<ZoneVisualState>((worst, state) => (STATE_RANK[state] > STATE_RANK[worst] ? state : worst), "normal");
}

export function stateLabel(state: ZoneVisualState): string {
  switch (state) {
    case "occupied":
      return "Occupied";
    case "opportunity":
      return "Optimization opportunity";
    case "anomaly":
      return "Anomaly";
    case "offline":
      return "Offline";
    case "optimized":
      return "Optimized";
    default:
      return "Normal";
  }
}

function roomDevices(snapshot: EnergySnapshot, zone: FloorPlanZone): Device[] {
  const listed = new Set(zone.deviceIds);
  return snapshot.devices.filter((device) => device.roomId === zone.id || listed.has(device.id));
}

function expectedPower(devices: Device[], people: number): number {
  return devices.reduce((sum, device) => {
    if (!LOAD_DEVICE_TYPES.includes(device.type)) return sum;
    if (device.type === "lighting" || device.type === "computer") {
      return sum + (people > 0 ? (device.props?.ratedPowerKw ?? device.powerKw) : 0);
    }
    if (device.type === "hvac" || device.type === "heating" || device.type === "cooling") {
      const occupied = device.props?.expectedPowerKw ?? device.props?.comfortPowerKw ?? device.powerKw;
      const empty = device.props?.ecoPowerKw ?? occupied * 0.45;
      return sum + (people > 0 ? occupied : empty);
    }
    return sum + devicePower(device);
  }, 0);
}

export function liveZones(snapshot: EnergySnapshot, derived: Derived, plan: FloorPlan): ZoneLive[] {
  const insights = activeInsights(snapshot, derived);
  const catalog = mockDataProvider.getAIInsights();
  return plan.zones.map((zone) => {
    const devices = roomDevices(snapshot, zone);
    const people = derived.peopleByRoom[zone.id] ?? 0;
    const capacity = snapshot.occupancy.find((record) => record.roomId === zone.id)?.capacity ?? 0;
    const powerKw = devices.reduce((sum, device) => sum + devicePower(device), 0);
    const expectedKw = expectedPower(devices, people);
    const connected = devices.filter((device) => device.status === "connected").length;
    const warning = devices.filter((device) => device.status === "error" || device.status === "unknown").length;
    const offline = devices.filter((device) => device.status === "disconnected").length;
    const temps = devices.map((device) => device.props?.currentTempC).filter((value): value is number => value !== undefined);
    const hvac = devices.find((device) => device.type === "hvac" || device.type === "heating" || device.type === "cooling");
    const lights = devices.filter((device) => device.type === "lighting");
    const computers = devices.filter((device) => device.type === "computer");
    const insight = insights.find((item) => item.opportunity && (catalog.find((entry) => entry.id === item.id)?.powerRoomId === zone.id || catalog.find((entry) => entry.id === item.id)?.occupancyRoomId === zone.id));
    const applied = catalog.find((entry) => snapshot.appliedInsightIds.includes(entry.id) && (entry.powerRoomId === zone.id || entry.occupancyRoomId === zone.id));
    const hvacUnits = devices.filter((device) => device.type === "hvac" && device.props?.expectedPowerKw);
    const hvacExpected = hvacUnits.reduce((sum, device) => sum + (device.props?.expectedPowerKw ?? 0), 0);
    const hvacActual = hvacUnits.reduce((sum, device) => sum + devicePower(device), 0);
    const hvacHigh = hvacExpected > 0 && (hvacActual - hvacExpected) / hvacExpected >= 0.2;
    let state: ZoneVisualState = "normal";
    if (offline > 0) state = "offline";
    else if (hvacHigh) state = "anomaly";
    else if (insight && !insight.applied) state = "opportunity";
    else if (insight?.applied || applied) state = "optimized";
    else if (people > 0) state = "occupied";
    const deviationPct = expectedKw > 0 ? ((powerKw - expectedKw) / expectedKw) * 100 : 0;
    return {
      zone,
      powerKw,
      expectedKw,
      people,
      capacity,
      state,
      connected,
      warning,
      offline,
      temperatureC: temps.length ? temps.reduce((sum, value) => sum + value, 0) / temps.length : null,
      hvacOn: Boolean(hvac && hvac.state === "on"),
      hvacMode: hvac?.props?.mode ?? null,
      lightsOn: lights.filter((device) => device.state === "on").length,
      lightsTotal: lights.length,
      computersOn: computers.filter((device) => device.state === "on").length,
      insightId: insight?.id ?? null,
      insightText: insight?.what ?? null,
      dailySavingUsd: insight?.dailySavingUsd ?? 0,
      deviationPct,
    };
  });
}
