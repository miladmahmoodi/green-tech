import { mockDataProvider } from "@/lib/mock-data";
import { LOAD_DEVICE_TYPES } from "@/types/energy";
import type {
  AutomationRule,
  BatterySystem,
  Building,
  Campus,
  Condition,
  Device,
  DevicePatch,
  EnergyPrices,
  Floor,
  OccupancyRecord,
  OptimizationPlan,
  Room,
  SavingsEntry,
  Scenario,
  ScenarioChanges,
  SkippedCommand,
  SolarSystem,
} from "@/types/energy";

export const DEMO_START = "2026-10-04T06:30:00.000Z";

export interface EnergySnapshot {
  campus: Campus;
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  devices: Device[];
  occupancy: OccupancyRecord[];
  rules: AutomationRule[];
  prices: EnergyPrices;
  solar: SolarSystem;
  battery: BatterySystem;
  appliedInsightIds: string[];
  savings: SavingsEntry[];
  scenarioLog: { id: string; name: string; at: string }[];
  dismissedAlertIds: string[];
  acknowledgedAlertIds: string[];
  demoNow: string;
  highlight: string | null;
  storyIndex: number;
}

export interface Derived {
  campusPowerKw: number;
  powerByBuilding: Record<string, number>;
  powerByFloor: Record<string, number>;
  powerByRoom: Record<string, number>;
  powerByCategory: { type: string; powerKw: number }[];
  baseloadKw: number;
  solarKw: number;
  batteryPowerKw: number;
  batterySoc: number;
  surplusKw: number;
  gridImportKw: number;
  gridExportKw: number;
  solarToBuildingKw: number;
  solarToBatteryKw: number;
  batteryToBuildingKw: number;
  gridToBuildingKw: number;
  priceUsd: number;
  isPeak: boolean;
  costPerHour: number;
  people: number;
  peopleByRoom: Record<string, number>;
  hvacDeviationByFloor: Record<string, number>;
  lightingOnByRoom: Record<string, number>;
  expectedKwh: number;
  actualKwh: number;
  expectedPowerKw: number;
  deviationPct: number;
  statusLabel: string;
  contextFactors: { label: string; detail: string }[];
}

export function loadSnapshot(): EnergySnapshot {
  const provider = mockDataProvider;
  return {
    campus: provider.getCampus(),
    buildings: provider.getBuildings(),
    floors: provider.getFloors(),
    rooms: provider.getRooms(),
    devices: provider.getDevices(),
    occupancy: provider.getOccupancy(),
    rules: provider.getAutomationRules(),
    prices: provider.getEnergyPrices(),
    solar: provider.getSolarData(),
    battery: provider.getBatteryData(),
    appliedInsightIds: [],
    savings: [],
    scenarioLog: [],
    dismissedAlertIds: [],
    acknowledgedAlertIds: [],
    demoNow: DEMO_START,
    highlight: null,
    storyIndex: -1,
  };
}

export function isLoad(device: Device): boolean {
  return LOAD_DEVICE_TYPES.includes(device.type);
}

export function devicePower(device: Device): number {
  if (!isLoad(device) || device.state !== "on") return 0;
  return device.powerKw;
}

export function derive(snapshot: EnergySnapshot): Derived {
  const powerByRoom: Record<string, number> = {};
  const powerByFloor: Record<string, number> = {};
  const powerByBuilding: Record<string, number> = {};
  const category = new Map<string, number>();

  for (const building of snapshot.buildings) {
    powerByBuilding[building.id] = building.baseloadKw;
  }
  for (const floor of snapshot.floors) {
    powerByFloor[floor.id] = 0;
  }
  for (const room of snapshot.rooms) {
    powerByRoom[room.id] = 0;
  }

  for (const device of snapshot.devices) {
    const power = devicePower(device);
    powerByRoom[device.roomId] = (powerByRoom[device.roomId] ?? 0) + power;
    powerByFloor[device.floorId] = (powerByFloor[device.floorId] ?? 0) + power;
    powerByBuilding[device.buildingId] = (powerByBuilding[device.buildingId] ?? 0) + power;
    if (isLoad(device)) category.set(device.type, (category.get(device.type) ?? 0) + power);
  }

  const baseloadKw = snapshot.buildings.reduce((sum, building) => sum + building.baseloadKw, 0);
  for (const building of snapshot.buildings) {
    const share = baseloadKw === 0 ? 0 : building.baseloadKw / baseloadKw;
    if (share === 0) continue;
    for (const floor of snapshot.floors.filter((item) => item.buildingId === building.id)) {
      powerByFloor[floor.id] += building.baseloadKw / snapshot.floors.filter((item) => item.buildingId === building.id).length;
    }
  }

  const campusPowerKw = round(Object.values(powerByBuilding).reduce((sum, value) => sum + value, 0));
  const solarKw = snapshot.solar.currentKw;
  const batteryPowerKw = snapshot.battery.powerKw;
  const batterySoc = snapshot.battery.soc;
  const surplusKw = round(Math.max(0, solarKw - campusPowerKw));
  const netGrid = round(campusPowerKw - solarKw - batteryPowerKw);
  const gridImportKw = netGrid > 0 ? netGrid : 0;
  const gridExportKw = netGrid < 0 ? round(-netGrid) : 0;
  const batteryToBuildingKw = Math.max(0, batteryPowerKw);
  const solarToBatteryKw = Math.max(0, -batteryPowerKw);
  const solarToBuildingKw = round(Math.max(0, Math.min(solarKw - solarToBatteryKw, campusPowerKw - batteryToBuildingKw)));
  const gridToBuildingKw = gridImportKw;
  const priceUsd = snapshot.prices.currentUsdPerKwh;
  const isPeak = priceUsd >= snapshot.prices.peakUsdPerKwh;
  const peopleByRoom = Object.fromEntries(snapshot.occupancy.map((record) => [record.roomId, record.people]));
  const people = snapshot.occupancy.reduce((sum, record) => sum + record.people, 0);

  const hvacDeviationByFloor: Record<string, number> = {};
  for (const floor of snapshot.floors) {
    const units = snapshot.devices.filter((device) => device.floorId === floor.id && device.type === "hvac");
    const actual = units.reduce((sum, device) => sum + devicePower(device), 0);
    const expected = units.reduce((sum, device) => sum + (device.props?.expectedPowerKw ?? device.props?.comfortPowerKw ?? 0), 0);
    hvacDeviationByFloor[floor.id] = expected > 0 ? round(((actual - expected) / expected) * 100) : 0;
  }

  const lightingOnByRoom: Record<string, number> = {};
  for (const device of snapshot.devices) {
    if (device.type === "lighting" && device.state === "on") {
      lightingOnByRoom[device.roomId] = (lightingOnByRoom[device.roomId] ?? 0) + 1;
    }
  }

  const point = snapshot.solar.curve.find((item) => item.t === "10:30");
  const expectedPowerKw = point ? round(point.demandKw * 1.035) : round(campusPowerKw);
  const context = snapshot.campus.context;
  const actualKwh = context.dailyActualKwh ?? snapshot.campus.todayEnergyKwh;
  const expectedKwh = context.dailyExpectedKwh ?? round(snapshot.campus.todayEnergyKwh * (expectedPowerKw / Math.max(snapshot.campus.baselinePowerKw, 1)));
  const deviationPct = expectedKwh === 0 ? 0 : round(((actualKwh - expectedKwh) / expectedKwh) * 100);
  const statusLabel =
    context.deviationLabel ??
    (Math.abs(deviationPct) < 8 ? `${Math.abs(deviationPct).toFixed(1)}% ${deviationPct > 0 ? "above" : "below"} expected` : deviationPct > 0 ? `${deviationPct.toFixed(1)}% above expected` : `${Math.abs(deviationPct).toFixed(1)}% below expected`);

  const contextFactors = [
    { label: "Teaching schedule", detail: context.teachingScheduleActive ? "Active" : "Inactive" },
    { label: "Outdoor temperature", detail: `${context.outdoorTempC}°C` },
    { label: "Season", detail: context.season },
    { label: "Occupancy", detail: `${people} people on campus` },
    {
      label: "Calendar",
      detail: context.registrationPeriod ? "Student registration period" : context.examPeriod ? "Examination period" : "Regular teaching week",
    },
  ];
  if (context.highOccupancyEvent) contextFactors.push({ label: "Event", detail: "High occupancy event in progress" });

  return {
    campusPowerKw,
    powerByBuilding,
    powerByFloor,
    powerByRoom,
    powerByCategory: [...category.entries()]
      .map(([type, powerKw]) => ({ type, powerKw: round(powerKw) }))
      .sort((a, b) => b.powerKw - a.powerKw),
    baseloadKw: round(baseloadKw),
    solarKw,
    batteryPowerKw,
    batterySoc,
    surplusKw,
    gridImportKw,
    gridExportKw,
    solarToBuildingKw,
    solarToBatteryKw,
    batteryToBuildingKw,
    gridToBuildingKw,
    priceUsd,
    isPeak,
    costPerHour: round(gridImportKw * priceUsd),
    people,
    peopleByRoom,
    hvacDeviationByFloor,
    lightingOnByRoom,
    expectedKwh: round(expectedKwh),
    actualKwh: round(actualKwh),
    expectedPowerKw,
    deviationPct,
    statusLabel,
    contextFactors,
  };
}

export function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function resolveMetric(snapshot: EnergySnapshot, derived: Derived, metric: string): number | string | boolean | undefined {
  if (metric.startsWith("occupancy.")) return derived.peopleByRoom[metric.slice("occupancy.".length)] ?? 0;
  if (metric.startsWith("room.") && metric.endsWith(".powerKw")) {
    const roomId = metric.slice("room.".length, -".powerKw".length);
    return derived.powerByRoom[roomId] ?? 0;
  }
  if (metric.startsWith("room.") && metric.endsWith(".lightingOn")) {
    const roomId = metric.slice("room.".length, -".lightingOn".length);
    return derived.lightingOnByRoom[roomId] ?? 0;
  }
  if (metric.startsWith("device.") && metric.endsWith(".status")) {
    return snapshot.devices.find((device) => device.id === metric.split(".")[1])?.status;
  }
  if (metric.startsWith("device.") && metric.endsWith(".state")) {
    return snapshot.devices.find((device) => device.id === metric.split(".")[1])?.state;
  }
  if (metric.startsWith("device.") && metric.endsWith(".powerKw")) {
    const device = snapshot.devices.find((item) => item.id === metric.split(".")[1]);
    return device ? devicePower(device) : 0;
  }
  if (metric.startsWith("floor.") && metric.endsWith(".hvacDeviationPct")) {
    const floorId = metric.slice("floor.".length, -".hvacDeviationPct".length);
    return derived.hvacDeviationByFloor[floorId] ?? 0;
  }
  if (metric.startsWith("insight.") && metric.endsWith(".applied")) {
    const id = metric.slice("insight.".length, -".applied".length);
    return snapshot.appliedInsightIds.includes(id);
  }
  if (metric === "solar.currentKw") return derived.solarKw;
  if (metric === "solar.surplusKw") return derived.surplusKw;
  if (metric === "battery.soc") return derived.batterySoc;
  if (metric === "battery.powerKw") return derived.batteryPowerKw;
  if (metric === "price.current") return derived.priceUsd;
  if (metric === "context.registrationPeriod") return snapshot.campus.context.registrationPeriod;
  if (metric === "context.teachingScheduleActive") return snapshot.campus.context.teachingScheduleActive;
  if (metric === "context.highOccupancyEvent") return snapshot.campus.context.highOccupancyEvent;
  if (metric === "context.outdoorTempC") return snapshot.campus.context.outdoorTempC;
  if (metric === "clock.hour") return new Date(snapshot.demoNow).getUTCHours() + 4;
  return undefined;
}

export function conditionMatches(condition: Condition, value: number | string | boolean | undefined): boolean {
  if (value === undefined) return false;
  switch (condition.op) {
    case "eq":
      return value === condition.value;
    case "neq":
      return value !== condition.value;
    case "gt":
      return Number(value) > Number(condition.value);
    case "gte":
      return Number(value) >= Number(condition.value);
    case "lt":
      return Number(value) < Number(condition.value);
    case "lte":
      return Number(value) <= Number(condition.value);
    default:
      return false;
  }
}

export function matchesAll(snapshot: EnergySnapshot, derived: Derived, conditions: Condition[]): boolean {
  return conditions.every((condition) => conditionMatches(condition, resolveMetric(snapshot, derived, condition.metric)));
}

export function controlBlockReason(device: Device): string | null {
  if (device.type === "elevator") return "Monitoring only. Elevators are not controlled from the energy platform.";
  if (device.type === "electricity_meter" || device.type === "solar_panel" || device.type === "solar_inverter" || device.type === "battery") {
    return "Monitoring only.";
  }
  if (!device.controllable || device.controlMode === "manual") return "Local control. Remote control is unavailable.";
  if (device.status === "disconnected" || device.status === "error") return "Remote control is unavailable while the device is unreachable.";
  return null;
}

function applyPatch(device: Device, patch: DevicePatch): Device {
  return {
    ...device,
    state: patch.state ?? device.state,
    powerKw: patch.powerKw ?? device.powerKw,
    status: patch.status ?? device.status,
    controlMode: patch.controlMode ?? device.controlMode,
    props: patch.props ? { ...device.props, ...patch.props } : device.props,
  };
}

export interface PlanResult {
  devices: Device[];
  battery: BatterySystem;
  prices: EnergyPrices;
  skipped: SkippedCommand[];
  deltaKw: number;
}

export function runPlan(snapshot: EnergySnapshot, plan: OptimizationPlan): PlanResult {
  let devices: Device[] = snapshot.devices.map((device) => ({ ...device, props: device.props ? { ...device.props } : undefined }));
  let battery = { ...snapshot.battery };
  let prices = { ...snapshot.prices };
  const skipped: SkippedCommand[] = [];
  const before = devices.reduce((sum, device) => sum + devicePower(device), 0);

  const touch = (device: Device, patch: DevicePatch) => {
    const reason = controlBlockReason(device);
    const changesPower = patch.state !== undefined || patch.powerKw !== undefined || patch.props?.mode !== undefined;
    if (reason && changesPower) {
      skipped.push({ deviceId: device.id, deviceName: device.name, reason });
      return device;
    }
    if (reason && patch.props && !changesPower) {
      skipped.push({ deviceId: device.id, deviceName: device.name, reason });
      return device;
    }
    return applyPatch(device, patch);
  };

  for (const action of plan.actions) {
    if (action.type === "set_device") {
      devices = devices.map((device) => (device.id === action.id ? touch(device, action.patch) : device));
    }
    if (action.type === "set_devices") {
      devices = devices.map((device) => {
        const filter = action.filter;
        if (filter.roomId && device.roomId !== filter.roomId) return device;
        if (filter.floorId && device.floorId !== filter.floorId) return device;
        if (filter.buildingId && device.buildingId !== filter.buildingId) return device;
        if (filter.type && device.type !== filter.type) return device;
        if (filter.controllable !== undefined && device.controllable !== filter.controllable) return device;
        if (filter.state && device.state !== filter.state) return device;
        return touch(device, action.patch);
      });
    }
    if (action.type === "set_battery") {
      battery = { ...battery, soc: action.soc ?? battery.soc, powerKw: action.powerKw ?? battery.powerKw };
    }
    if (action.type === "set_price") {
      prices = { ...prices, currentUsdPerKwh: action.currentUsdPerKwh };
    }
  }

  const after = devices.reduce((sum, device) => sum + devicePower(device), 0);
  return { devices, battery, prices, skipped, deltaKw: round(before - after) };
}

export function applyScenario(snapshot: EnergySnapshot, scenario: Scenario): EnergySnapshot {
  const next = structuredClone(snapshot);
  const changes: ScenarioChanges = scenario.changes;
  if (changes.occupancy) {
    next.occupancy = next.occupancy.map((record) =>
      changes.occupancy?.[record.roomId] === undefined ? record : { ...record, people: changes.occupancy[record.roomId] },
    );
  }
  if (changes.devices) {
    next.devices = next.devices.map((device) => {
      const patch = changes.devices?.[device.id];
      return patch ? applyPatch(device, patch) : device;
    });
  }
  if (changes.baseload) {
    next.buildings = next.buildings.map((building) =>
      changes.baseload?.[building.id] === undefined ? building : { ...building, baseloadKw: changes.baseload[building.id] },
    );
  }
  if (changes.solar) next.solar = { ...next.solar, ...changes.solar };
  if (changes.battery) next.battery = { ...next.battery, ...changes.battery };
  if (changes.price) next.prices = { ...next.prices, ...changes.price };
  if (changes.context) next.campus = { ...next.campus, context: { ...next.campus.context, ...changes.context } };
  if (changes.demandTargetKw !== undefined) {
    const metered = next.devices.reduce((sum, device) => sum + devicePower(device), 0);
    const others = next.buildings.filter((building) => building.id !== "main-building").reduce((sum, building) => sum + building.baseloadKw, 0);
    const mainBaseload = Math.max(0, round(changes.demandTargetKw - metered - others));
    next.buildings = next.buildings.map((building) => (building.id === "main-building" ? { ...building, baseloadKw: mainBaseload } : building));
  }
  next.scenarioLog = [...next.scenarioLog, { id: scenario.id, name: scenario.name, at: next.demoNow }];
  return next;
}

export function roomName(snapshot: EnergySnapshot, roomId: string): string {
  return snapshot.rooms.find((room) => room.id === roomId)?.name ?? roomId;
}

export function buildingName(snapshot: EnergySnapshot, buildingId: string): string {
  return snapshot.buildings.find((building) => building.id === buildingId)?.name ?? buildingId;
}

export function floorName(snapshot: EnergySnapshot, floorId: string): string {
  return snapshot.floors.find((floor) => floor.id === floorId)?.name ?? floorId;
}

export function deviceLocation(snapshot: EnergySnapshot, device: Device): string {
  return roomName(snapshot, device.roomId);
}
