import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(root, { recursive: true });

const NOW = Date.parse("2026-10-04T10:30:00+04:00");
const seen = (secondsAgo) => new Date(NOW - secondsAgo * 1000).toISOString();

const buildings = [
  { id: "main-building", campusId: "aua", name: "Main Building", code: "MB", baseloadKw: 0, areaM2: 9200, location: { lat: 40.19315, lng: 44.50305 } },
  { id: "pab", campusId: "aua", name: "Paramaz Avedisian Building", code: "PAB", baseloadKw: 18.4, areaM2: 7400, location: { lat: 40.19235, lng: 44.50415 } },
  { id: "akian", campusId: "aua", name: "Akian Building", code: "AK", baseloadKw: 9.6, areaM2: 3100, location: { lat: 40.19185, lng: 44.50255 } },
];

const floors = [
  { id: "main-floor-1", buildingId: "main-building", name: "Floor 1 · Administration", level: 1 },
  { id: "main-floor-2", buildingId: "main-building", name: "Floor 2", level: 2 },
  { id: "main-floor-3", buildingId: "main-building", name: "Floor 3", level: 3 },
  { id: "main-floor-4", buildingId: "main-building", name: "Floor 4 · Faculty", level: 4 },
  { id: "pab-floor-1", buildingId: "pab", name: "Floor 1", level: 1 },
  { id: "pab-floor-2", buildingId: "pab", name: "Floor 2", level: 2 },
  { id: "akian-floor-1", buildingId: "akian", name: "Floor 1 · Gallery & Library", level: 1 },
  { id: "akian-floor-2", buildingId: "akian", name: "Floor 2", level: 2 },
];

const rooms = [
  { id: "admin-101", floorId: "main-floor-1", buildingId: "main-building", name: "Administration Suite", zoneType: "administration", areaM2: 640, capacity: 40 },
  { id: "lobby", floorId: "main-floor-1", buildingId: "main-building", name: "Main Lobby", zoneType: "common", areaM2: 280, capacity: 80 },
  { id: "plant-main", floorId: "main-floor-1", buildingId: "main-building", name: "Plant Room", zoneType: "plant", areaM2: 90, capacity: 2 },
  { id: "elevator-main", floorId: "main-floor-1", buildingId: "main-building", name: "Elevator Core", zoneType: "elevator", areaM2: 24, capacity: 0 },
  { id: "lab-204", floorId: "main-floor-2", buildingId: "main-building", name: "Computer Lab 204", zoneType: "lab", areaM2: 180, capacity: 36 },
  { id: "classroom-201", floorId: "main-floor-2", buildingId: "main-building", name: "Classroom 201", zoneType: "classroom", areaM2: 120, capacity: 40 },
  { id: "office-210", floorId: "main-floor-2", buildingId: "main-building", name: "Faculty Office 210", zoneType: "office", areaM2: 28, capacity: 4 },
  { id: "classroom-301", floorId: "main-floor-3", buildingId: "main-building", name: "Classroom 301", zoneType: "classroom", areaM2: 140, capacity: 48 },
  { id: "office-301", floorId: "main-floor-3", buildingId: "main-building", name: "Office 301", zoneType: "office", areaM2: 32, capacity: 4 },
  { id: "seminar-305", floorId: "main-floor-3", buildingId: "main-building", name: "Seminar 305", zoneType: "classroom", areaM2: 70, capacity: 18 },
  { id: "faculty-401", floorId: "main-floor-4", buildingId: "main-building", name: "Faculty Wing 401", zoneType: "office", areaM2: 420, capacity: 30 },
  { id: "pab-hall", floorId: "pab-floor-1", buildingId: "pab", name: "Lecture Hall", zoneType: "classroom", areaM2: 360, capacity: 120 },
  { id: "pab-labs", floorId: "pab-floor-2", buildingId: "pab", name: "Engineering Labs", zoneType: "lab", areaM2: 300, capacity: 40 },
  { id: "elevator-pab", floorId: "pab-floor-1", buildingId: "pab", name: "Elevator Core", zoneType: "elevator", areaM2: 18, capacity: 0 },
  { id: "gallery", floorId: "akian-floor-1", buildingId: "akian", name: "Gallery", zoneType: "common", areaM2: 400, capacity: 60 },
  { id: "reading-room", floorId: "akian-floor-1", buildingId: "akian", name: "Library", zoneType: "library", areaM2: 260, capacity: 50 },
  { id: "elevator-akian", floorId: "akian-floor-1", buildingId: "akian", name: "Elevator Core", zoneType: "elevator", areaM2: 12, capacity: 0 },
  { id: "solar-yard", floorId: "main-floor-1", buildingId: "main-building", name: "Roof Plant", zoneType: "plant", areaM2: 800, capacity: 0 },
];

const occupancySeed = {
  "admin-101": 22,
  lobby: 14,
  "plant-main": 1,
  "elevator-main": 0,
  "lab-204": 24,
  "classroom-201": 31,
  "office-210": 2,
  "classroom-301": 18,
  "office-301": 1,
  "seminar-305": 8,
  "faculty-401": 11,
  "pab-hall": 46,
  "pab-labs": 12,
  "elevator-pab": 0,
  gallery: 6,
  "reading-room": 19,
  "elevator-akian": 0,
  "solar-yard": 0,
};

function device(partial) {
  return {
    status: "connected",
    controlMode: "automatic",
    controllable: true,
    state: "on",
    lastSeen: seen(6),
    ...partial,
  };
}

const devices = [];

devices.push(
  device({
    id: "hvac-204",
    name: "HVAC-204",
    type: "hvac",
    buildingId: "main-building",
    floorId: "main-floor-2",
    roomId: "lab-204",
    powerKw: 4.2,
    lastSeen: seen(2),
    props: { mode: "comfort", setpointC: 22, currentTempC: 22.4, ecoPowerKw: 1.9, comfortPowerKw: 4.2, standbyPowerKw: 0.05, schedule: ["08:00–20:00"], expectedPowerKw: 4.2 },
  }),
);

for (let i = 1; i <= 14; i += 1) {
  const id = `light-204-${String(i).padStart(2, "0")}`;
  const local = i === 3;
  devices.push(
    device({
      id,
      name: `Light-204-${String(i).padStart(2, "0")}`,
      type: "lighting",
      buildingId: "main-building",
      floorId: "main-floor-2",
      roomId: "lab-204",
      controlMode: local ? "manual" : "automatic",
      controllable: !local,
      powerKw: 0.12,
      lastSeen: seen(i === 1 ? 4 : 5 + i),
      props: { ratedPowerKw: 0.12 },
    }),
  );
}

for (let i = 1; i <= 32; i += 1) {
  devices.push(
    device({
      id: `pc-204-${String(i).padStart(2, "0")}`,
      name: `PC-204-${String(i).padStart(2, "0")}`,
      type: "computer",
      buildingId: "main-building",
      floorId: "main-floor-2",
      roomId: "lab-204",
      powerKw: 0.08125,
      lastSeen: seen(i === 17 ? 8 : 10 + (i % 20)),
      props: { ratedPowerKw: 0.08125 },
    }),
  );
}

devices.push(
  device({
    id: "smartplug-204-01",
    name: "SmartPlug-204-01",
    type: "smart_plug",
    buildingId: "main-building",
    floorId: "main-floor-2",
    roomId: "lab-204",
    powerKw: 0.35,
    lastSeen: seen(12),
    props: { plugCategory: "Lab equipment", ratedPowerKw: 0.8, energyTodayKwh: 2.4 },
  }),
  device({
    id: "powermeter-204",
    name: "PowerMeter-204",
    type: "electricity_meter",
    buildingId: "main-building",
    floorId: "main-floor-2",
    roomId: "lab-204",
    controllable: false,
    controlMode: "automatic",
    state: "on",
    powerKw: 0,
    lastSeen: seen(2),
    props: { energyTodayKwh: 61.4 },
  }),
  device({
    id: "hvac-admin",
    name: "HVAC-Admin",
    type: "hvac",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "admin-101",
    powerKw: 6.4,
    lastSeen: seen(3),
    props: { mode: "comfort", setpointC: 22.5, currentTempC: 23.1, ecoPowerKw: 3.6, comfortPowerKw: 6.4, standbyPowerKw: 0.08, schedule: ["07:30–19:00"], expectedPowerKw: 5.1 },
  }),
  device({
    id: "hvac-f3",
    name: "HVAC-Floor3",
    type: "hvac",
    buildingId: "main-building",
    floorId: "main-floor-3",
    roomId: "classroom-301",
    powerKw: 8,
    lastSeen: seen(4),
    props: { mode: "auto", setpointC: 22, currentTempC: 23.6, ecoPowerKw: 4.2, comfortPowerKw: 8, standbyPowerKw: 0.08, schedule: ["08:00–21:00"], expectedPowerKw: 8 },
  }),
  device({
    id: "hvac-f4",
    name: "HVAC-Floor4",
    type: "hvac",
    buildingId: "main-building",
    floorId: "main-floor-4",
    roomId: "faculty-401",
    powerKw: 3.4,
    props: { mode: "auto", setpointC: 21.5, currentTempC: 21.8, ecoPowerKw: 1.8, comfortPowerKw: 3.4, standbyPowerKw: 0.05, schedule: ["08:00–18:00"], expectedPowerKw: 3.2 },
  }),
  device({
    id: "heat-main",
    name: "Heating-Main",
    type: "heating",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "plant-main",
    powerKw: 2.2,
    props: { mode: "auto", setpointC: 21, currentTempC: 20.6, ecoPowerKw: 1.1, comfortPowerKw: 2.2, schedule: ["06:00–10:00", "16:00–20:00"] },
  }),
  device({
    id: "wh-01",
    name: "Water Heater #01",
    type: "water_heater",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "plant-main",
    controlMode: "scheduled",
    powerKw: 2.4,
    props: { currentTempC: 58, targetTempC: 60, schedule: ["06:00–08:00", "18:00–20:00"], energyTodayKwh: 9.6, ratedPowerKw: 4 },
  }),
  device({
    id: "wh-02",
    name: "Water Heater #02",
    type: "water_heater",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "plant-main",
    controlMode: "scheduled",
    powerKw: 3.8,
    lastSeen: seen(5),
    props: { currentTempC: 61, targetTempC: 60, schedule: ["06:00–08:00", "18:00–20:00"], energyTodayKwh: 14.2, ratedPowerKw: 4.5 },
  }),
  device({
    id: "elev-main",
    name: "Elevator-Main",
    type: "elevator",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "elevator-main",
    controllable: false,
    controlMode: "automatic",
    powerKw: 1.5,
    props: { tripsToday: 186, peakKw: 7.2, energyTodayKwh: 18.4 },
  }),
  device({
    id: "meter-main",
    name: "Main Building Meter",
    type: "electricity_meter",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "lobby",
    controllable: false,
    powerKw: 0,
    props: { energyTodayKwh: 742 },
  }),
);

const extraLights = [
  ["light-admin", "Admin Lights", "main-building", "main-floor-1", "admin-101", 1.1],
  ["light-lobby", "Lobby Lights", "main-building", "main-floor-1", "lobby", 0.8],
  ["light-201", "Light-201", "main-building", "main-floor-2", "classroom-201", 0.7],
  ["light-301", "Light-301", "main-building", "main-floor-3", "classroom-301", 0.64],
  ["light-305", "Light-305", "main-building", "main-floor-3", "seminar-305", 0.36],
  ["light-401", "Faculty Lights", "main-building", "main-floor-4", "faculty-401", 0.9],
  ["light-pab", "Lecture Hall Lights", "pab", "pab-floor-1", "pab-hall", 1.4],
  ["light-pab-labs", "Engineering Lab Lights", "pab", "pab-floor-2", "pab-labs", 0.8],
  ["light-gallery", "Gallery Lights", "akian", "akian-floor-1", "gallery", 0.7],
  ["light-reading", "Library Lights", "akian", "akian-floor-1", "reading-room", 0.55],
];

for (const [id, name, buildingId, floorId, roomId, powerKw] of extraLights) {
  devices.push(device({ id, name, type: "lighting", buildingId, floorId, roomId, powerKw, props: { ratedPowerKw: powerKw } }));
}

devices.push(
  device({
    id: "smartplug-04",
    name: "SmartPlug-04",
    type: "smart_plug",
    buildingId: "main-building",
    floorId: "main-floor-3",
    roomId: "office-301",
    state: "off",
    powerKw: 0,
    lastSeen: seen(120),
    controlMode: "manual",
    controllable: true,
    props: { plugCategory: "Printer", ratedPowerKw: 0.84, energyTodayKwh: 1.1 },
  }),
  device({
    id: "plug-coffee",
    name: "SmartPlug-Coffee",
    type: "smart_plug",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "admin-101",
    powerKw: 0.92,
    props: { plugCategory: "Coffee machine", ratedPowerKw: 1.4, energyTodayKwh: 3.2 },
  }),
  device({
    id: "plug-monitor",
    name: "SmartPlug-Monitor",
    type: "smart_plug",
    buildingId: "main-building",
    floorId: "main-floor-3",
    roomId: "office-301",
    powerKw: 0.04,
    props: { plugCategory: "Monitor", ratedPowerKw: 0.06, energyTodayKwh: 0.3 },
  }),
  device({
    id: "plug-tv",
    name: "SmartPlug-TV",
    type: "smart_plug",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "lobby",
    state: "off",
    powerKw: 0,
    props: { plugCategory: "TV", ratedPowerKw: 0.18, energyTodayKwh: 0.4 },
  }),
  device({
    id: "hvac-pab",
    name: "HVAC-PAB",
    type: "hvac",
    buildingId: "pab",
    floorId: "pab-floor-1",
    roomId: "pab-hall",
    powerKw: 5.6,
    props: { mode: "auto", setpointC: 22, currentTempC: 22.2, ecoPowerKw: 3.1, comfortPowerKw: 5.6, standbyPowerKw: 0.06, schedule: ["08:00–21:00"], expectedPowerKw: 5.4 },
  }),
  device({
    id: "cool-pab",
    name: "Cooling-PAB",
    type: "cooling",
    buildingId: "pab",
    floorId: "pab-floor-2",
    roomId: "pab-labs",
    state: "off",
    powerKw: 0,
    props: { mode: "off", setpointC: 23, currentTempC: 21.4, ecoPowerKw: 1.2, comfortPowerKw: 2.4, schedule: ["12:00–16:00"] },
  }),
  device({
    id: "hvac-akian",
    name: "HVAC-Akian",
    type: "hvac",
    buildingId: "akian",
    floorId: "akian-floor-1",
    roomId: "reading-room",
    powerKw: 3.1,
    props: { mode: "eco", setpointC: 21, currentTempC: 21.2, ecoPowerKw: 3.1, comfortPowerKw: 4.4, standbyPowerKw: 0.05, schedule: ["09:00–20:00"], expectedPowerKw: 3.0 },
  }),
  device({
    id: "elev-pab",
    name: "Elevator-PAB",
    type: "elevator",
    buildingId: "pab",
    floorId: "pab-floor-1",
    roomId: "elevator-pab",
    controllable: false,
    powerKw: 0.9,
    props: { tripsToday: 94, peakKw: 6.4, energyTodayKwh: 8.1 },
  }),
  device({
    id: "elev-akian",
    name: "Elevator-Akian",
    type: "elevator",
    buildingId: "akian",
    floorId: "akian-floor-1",
    roomId: "elevator-akian",
    controllable: false,
    powerKw: 0.4,
    props: { tripsToday: 41, peakKw: 4.1, energyTodayKwh: 3.3 },
  }),
  device({
    id: "pcs-pab",
    name: "Engineering Workstations",
    type: "computer",
    buildingId: "pab",
    floorId: "pab-floor-2",
    roomId: "pab-labs",
    powerKw: 1.8,
    props: { groupSize: 12, ratedPowerKw: 1.8 },
  }),
  device({
    id: "pcs-faculty",
    name: "Faculty Workstations",
    type: "computer",
    buildingId: "main-building",
    floorId: "main-floor-4",
    roomId: "faculty-401",
    powerKw: 0.72,
    props: { groupSize: 8, ratedPowerKw: 0.96 },
  }),
  device({
    id: "solar-array",
    name: "Roof Array A",
    type: "solar_panel",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "solar-yard",
    controllable: false,
    powerKw: 0,
    props: { ratedPowerKw: 120 },
  }),
  device({
    id: "inverter-1",
    name: "Inverter 1",
    type: "solar_inverter",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "solar-yard",
    controllable: false,
    powerKw: 0,
    props: { ratedPowerKw: 100 },
  }),
  device({
    id: "battery-1",
    name: "Campus Battery",
    type: "battery",
    buildingId: "main-building",
    floorId: "main-floor-1",
    roomId: "solar-yard",
    controllable: false,
    powerKw: 0,
    props: { ratedPowerKw: 60 },
  }),
);

const LOAD_TYPES = new Set(["lighting", "hvac", "heating", "cooling", "computer", "smart_plug", "water_heater", "elevator"]);
const metered = devices.filter((d) => LOAD_TYPES.has(d.type) && d.state === "on").reduce((s, d) => s + d.powerKw, 0);
const otherBaseload = buildings.filter((b) => b.id !== "main-building").reduce((s, b) => s + b.baseloadKw, 0);
const main = buildings.find((b) => b.id === "main-building");
main.baseloadKw = Math.round((124 - metered - otherBaseload) * 1000) / 1000;

const labPcs = devices.filter((d) => d.roomId === "lab-204" && d.type === "computer").reduce((s, d) => s + d.powerKw, 0);
const labHvac = devices.find((d) => d.id === "hvac-204").powerKw;
console.log("metered", metered.toFixed(3), "main baseload", main.baseloadKw, "total", (metered + otherBaseload + main.baseloadKw).toFixed(3));
console.log("lab computers+hvac", (labPcs + labHvac).toFixed(3), "pcs", labPcs.toFixed(3), "devices", devices.length);

function curve(hours, fn) {
  const points = [];
  for (let i = 0; i < hours * 4; i += 1) {
    const hour = i / 4;
    const hh = String(Math.floor(hour)).padStart(2, "0");
    const mm = String((i % 4) * 15).padStart(2, "0");
    points.push({ t: `${hh}:${mm}`, ...fn(hour) });
  }
  return points;
}

function diurnal(hour) {
  const day = Math.max(0, Math.sin(((hour - 6) / 14) * Math.PI));
  const solar = hour >= 6.5 && hour <= 18.5 ? Math.round(82 * Math.sin(((hour - 6.5) / 12) * Math.PI) * 10) / 10 : 0;
  const demand = Math.round((48 + day * 76 + (hour >= 9 && hour <= 16 ? 8 : 0)) * 10) / 10;
  const price = hour >= 18 && hour < 21 ? 0.16 : 0.08;
  const batteryKw = solar > demand ? -Math.min(25, solar - demand) : hour >= 18 && hour < 21 ? 18 : 0;
  return { solar, demand, price, batteryKw, actual: demand, expected: Math.round(demand * 1.035 * 10) / 10, baseline: Math.round(demand * 0.92 * 10) / 10 };
}

const campusCurve = curve(24, diurnal);
// Pin the 10:30 sample to the live baseline so the chart agrees with the KPIs.
const nowPoint = campusCurve.find((p) => p.t === "10:30");
nowPoint.actual = 124;
nowPoint.demand = 124;
nowPoint.solar = 82;
nowPoint.expected = 128.4;
nowPoint.baseline = 116;
nowPoint.price = 0.08;
nowPoint.batteryKw = 0;

const intraday = { campus: campusCurve };
for (const building of buildings) {
  const share = building.id === "main-building" ? 0.62 : building.id === "pab" ? 0.26 : 0.12;
  intraday[building.id] = campusCurve.map((p) => ({
    ...p,
    actual: Math.round(p.actual * share * 10) / 10,
    expected: Math.round(p.expected * share * 10) / 10,
    baseline: Math.round(p.baseline * share * 10) / 10,
    demand: Math.round(p.demand * share * 10) / 10,
  }));
}

function history(labels, scale) {
  return labels.map((label, i) => {
    const wave = 0.92 + ((i * 37) % 11) / 100;
    const kwh = Math.round(scale * wave);
    const solarKwh = Math.round(kwh * 0.28);
    const cost = Math.round(kwh * 0.092 * 100) / 100;
    return {
      label,
      kwh,
      cost,
      solarKwh,
      batteryKwh: Math.round(kwh * 0.06),
      savingsUsd: Math.round(kwh * 0.012 * 100) / 100,
      co2Kg: Math.round(kwh * 0.233),
      peakKw: Math.round(90 + (i % 7) * 6),
    };
  });
}

const daily = history(
  ["Sep 28", "Sep 29", "Sep 30", "Oct 1", "Oct 2", "Oct 3", "Oct 4"],
  2400,
);
daily[6].kwh = 1284;
daily[6].cost = 143.2;
daily[6].savingsUsd = 38.4;

const telemetry = {
  intraday,
  daily,
  weekly: history(["W36", "W37", "W38", "W39", "W40"], 11800),
  monthly: history(["May", "Jun", "Jul", "Aug", "Sep", "Oct"], 52000),
};

const occupancy = rooms.map((room) => ({
  roomId: room.id,
  people: occupancySeed[room.id] ?? 0,
  capacity: room.capacity,
}));

const schedules = [
  { id: "teaching", name: "Teaching timetable", scope: "Campus", windows: ["09:00–12:30", "13:30–18:00"], notes: "Weekday teaching blocks. Labs follow the same timetable." },
  { id: "hvac-occupied", name: "Occupied HVAC", scope: "Main Building", windows: ["07:30–20:00"], notes: "Comfort mode while teaching is active. Eco outside these hours." },
  { id: "water-heating", name: "Water heating", scope: "Plant Room", windows: ["06:00–08:00", "18:00–20:00"], notes: "Two recovery windows. The evening window overlaps the peak tariff." },
  { id: "lab-204", name: "Computer Lab 204", scope: "Computer Lab 204", windows: ["09:00–13:00", "14:00–18:00"], notes: "Scheduled classes. The room is expected to be empty after 18:00." },
  { id: "registration", name: "Registration support", scope: "Administration Suite", windows: ["09:00–17:00"], notes: "Extended staffing during the registration period." },
];

const prices = {
  currency: "USD",
  unit: "kWh",
  offPeakUsdPerKwh: 0.08,
  peakUsdPerKwh: 0.16,
  peakWindow: "18:00–21:00",
  currentUsdPerKwh: 0.08,
  curve: Array.from({ length: 24 }, (_, hour) => ({
    t: `${String(hour).padStart(2, "0")}:00`,
    usdPerKwh: hour >= 18 && hour < 21 ? 0.16 : 0.08,
  })),
};

const solar = {
  capacityKw: 120,
  currentKw: 82,
  inverterId: "inverter-1",
  inverterStatus: "connected",
  curve: campusCurve.map((p) => ({
    t: p.t,
    generationKw: p.t === "10:30" ? 82 : p.solar,
    demandKw: p.demand,
    priceUsd: p.price,
    batteryKw: p.batteryKw,
  })),
};

const battery = {
  capacityKwh: 240,
  soc: 67,
  powerKw: 0,
  maxChargeKw: 60,
  maxDischargeKw: 60,
  reserveSoc: 20,
  status: "connected",
};

const labPlan = {
  id: "plan-lab-204",
  summary: "Turn off unused lights and inactive computers, and set HVAC-204 to Eco.",
  actions: [
    { type: "set_devices", filter: { roomId: "lab-204", type: "lighting", controllable: true, state: "on" }, patch: { state: "off", powerKw: 0 } },
    { type: "set_devices", filter: { roomId: "lab-204", type: "computer", controllable: true, state: "on" }, patch: { state: "off", powerKw: 0 } },
    { type: "set_device", id: "hvac-204", patch: { state: "on", powerKw: 1.9, props: { mode: "eco" } } },
  ],
  expectedDailyUsd: 3.4,
  expectedMonthlyUsd: 102,
  expectedPowerKw: 4.9,
  assumedHoursPerDay: 8.7,
};

const insights = [
  {
    id: "lab-204-unoccupied",
    title: "Energy optimization opportunity detected",
    location: "Computer Lab 204",
    category: "opportunity",
    what: "32 computers and HVAC are consuming energy while the room is currently unoccupied.",
    why: "An empty teaching lab does not need comfort cooling or active workstations. This load is waste, not useful work.",
    cause: "Occupancy dropped to zero, but lighting, computers, and HVAC stayed in the occupied state.",
    actionLabel: "Shut down unused computers, turn off remote lights, and set HVAC to Eco.",
    confidence: 94,
    dailySavingUsd: 3.4,
    monthlySavingUsd: 102,
    occupancyRoomId: "lab-204",
    powerRoomId: "lab-204",
    powerTypes: ["computer", "hvac"],
    wasteKw: 4.9,
    trigger: [
      { metric: "occupancy.lab-204", op: "eq", value: 0 },
      { metric: "room.lab-204.powerKw", op: "gt", value: 2 },
    ],
    plan: labPlan,
    opportunity: true,
    contextNotes: ["Room occupancy is zero", "Teaching block has ended for this room", "Remote control is available for computers, HVAC, and 13 of 14 lights"],
  },
  {
    id: "lights-lab-204",
    title: "Unused lighting in an empty lab",
    location: "Computer Lab 204",
    category: "opportunity",
    what: "14 lights are on while Computer Lab 204 is empty.",
    why: "Lighting left on in an unoccupied room adds a steady load with no occupant benefit.",
    cause: "The lighting zone stayed in automatic occupied mode after the room emptied. Light-204-03 is local-only and cannot be switched remotely.",
    actionLabel: "Turn off unused lighting.",
    confidence: 96,
    dailySavingUsd: 1.08,
    monthlySavingUsd: 32,
    occupancyRoomId: "lab-204",
    powerRoomId: "lab-204",
    powerTypes: ["lighting"],
    wasteKw: 1.56,
    trigger: [
      { metric: "occupancy.lab-204", op: "eq", value: 0 },
      { metric: "room.lab-204.lightingOn", op: "gt", value: 1 },
    ],
    suppress: [{ metric: "insight.lab-204-unoccupied.applied", op: "eq", value: true }],
    plan: {
      id: "plan-lights-204",
      summary: "Turn off remotely controlled lights in Computer Lab 204.",
      actions: [{ type: "set_devices", filter: { roomId: "lab-204", type: "lighting", controllable: true, state: "on" }, patch: { state: "off", powerKw: 0 } }],
      expectedDailyUsd: 1.08,
      expectedMonthlyUsd: 32,
      expectedPowerKw: 1.56,
      assumedHoursPerDay: 8.7,
    },
    opportunity: true,
    standing: true,
  },
  {
    id: "admin-hvac",
    title: "HVAC schedule is longer than occupancy",
    location: "Administration Suite",
    category: "opportunity",
    what: "Administration HVAC is holding comfort mode above the historical schedule for this floor.",
    why: "Comfort mode costs more than Eco once the suite is only partly staffed, and the gap repeats every weekday.",
    cause: "The occupied schedule still ends at 19:00, later than the last two weeks of badge-in patterns.",
    actionLabel: "Adjust HVAC schedule",
    confidence: 89,
    dailySavingUsd: 2.53,
    monthlySavingUsd: 76,
    occupancyRoomId: "admin-101",
    powerRoomId: "admin-101",
    powerTypes: ["hvac"],
    wasteKw: 2.8,
    trigger: [{ metric: "context.teachingScheduleActive", op: "eq", value: true }],
    plan: {
      id: "plan-admin-hvac",
      summary: "Set administration HVAC to Eco and shorten the comfort window.",
      actions: [{ type: "set_device", id: "hvac-admin", patch: { powerKw: 3.6, props: { mode: "eco", schedule: ["08:00–17:30"] } } }],
      expectedDailyUsd: 2.53,
      expectedMonthlyUsd: 76,
      expectedPowerKw: 2.8,
      assumedHoursPerDay: 6,
    },
    opportunity: true,
    standing: true,
  },
  {
    id: "water-heating-shift",
    title: "Water heating overlaps a higher-cost window",
    location: "Plant Room",
    category: "opportunity",
    what: "Water Heater #02 recovers during 18:00–20:00, which sits inside the peak tariff.",
    why: "The same thermal energy costs twice as much inside 18:00–21:00 as it does in the morning window.",
    cause: "The evening schedule was set for occupancy, not for the tariff.",
    actionLabel: "Shift heating to lower-cost period",
    confidence: 91,
    dailySavingUsd: 1.6,
    monthlySavingUsd: 48,
    powerRoomId: "plant-main",
    powerTypes: ["water_heater"],
    trigger: [{ metric: "device.wh-02.state", op: "eq", value: "on" }],
    plan: {
      id: "plan-wh-02",
      summary: "Move the evening recovery window to late morning, before the peak tariff.",
      actions: [{ type: "set_device", id: "wh-02", patch: { props: { schedule: ["06:00–08:00", "10:30–12:30"] } } }],
      expectedDailyUsd: 1.6,
      expectedMonthlyUsd: 48,
      expectedPowerKw: 0,
      assumedHoursPerDay: 2,
    },
    opportunity: true,
    standing: true,
  },
  {
    id: "solar-charge",
    title: "Charge the battery with surplus solar",
    location: "Campus",
    category: "strategy",
    what: "Solar generation is above building demand, and the battery has room to store it.",
    why: "Energy stored now avoids importing from the grid during the 18:00–21:00 peak, when the price doubles.",
    cause: "Midday solar exceeds the current load and the battery is below its charge limit.",
    actionLabel: "Charge battery with 25 kW solar surplus.",
    confidence: 93,
    dailySavingUsd: 12.4,
    monthlySavingUsd: 248,
    wasteKw: 25,
    trigger: [
      { metric: "solar.surplusKw", op: "gt", value: 20 },
      { metric: "battery.soc", op: "lt", value: 90 },
    ],
    plan: {
      id: "plan-charge",
      summary: "Charge the campus battery at 25 kW from surplus solar.",
      actions: [{ type: "set_battery", soc: 74, powerKw: -25 }],
      expectedDailyUsd: 12.4,
      expectedMonthlyUsd: 248,
      expectedPowerKw: 25,
      assumedHoursPerDay: 2,
    },
    opportunity: true,
    contextNotes: ["Grid price is low", "Battery is below 90%", "Surplus would otherwise be exported at the off-peak rate"],
  },
  {
    id: "peak-discharge",
    title: "Discharge the battery through the peak",
    location: "Campus",
    category: "strategy",
    what: "The grid price has moved to the peak tariff while the battery still holds stored energy.",
    why: "Each kilowatt-hour served from the battery avoids the $0.16 peak price.",
    cause: "The tariff window 18:00–21:00 is active and the battery is above its reserve.",
    actionLabel: "Discharge battery during the peak period to reduce grid cost.",
    confidence: 92,
    dailySavingUsd: 4.8,
    monthlySavingUsd: 96,
    trigger: [
      { metric: "price.current", op: "gte", value: 0.16 },
      { metric: "battery.soc", op: "gt", value: 30 },
    ],
    plan: {
      id: "plan-discharge",
      summary: "Discharge the battery at 30 kW to cover building load through the peak.",
      actions: [{ type: "set_battery", powerKw: 30 }],
      expectedDailyUsd: 4.8,
      expectedMonthlyUsd: 96,
      expectedPowerKw: 30,
      assumedHoursPerDay: 2,
    },
    opportunity: true,
  },
  {
    id: "battery-full",
    title: "Battery is nearly full",
    location: "Campus",
    category: "strategy",
    what: "The campus battery is at the top of its usable range, so further charging has little value.",
    why: "A full battery cannot absorb midday surplus. Extra solar should be exported or used to bring flexible loads forward.",
    cause: "State of charge is above 90%, which also blocks the automatic charge rule.",
    actionLabel: "Export surplus solar or shift flexible load into this hour.",
    confidence: 90,
    dailySavingUsd: 2.1,
    monthlySavingUsd: 42,
    trigger: [{ metric: "battery.soc", op: "gte", value: 90 }],
    plan: null,
    opportunity: false,
    contextNotes: ["Charge rule requires battery below 90%", "Reserve for the evening peak is already met"],
  },
  {
    id: "registration-normal",
    title: "Usage is inside the expected range",
    location: "AUA Campus",
    category: "context",
    what: "Today's consumption is 6.2% below the context-adjusted expectation.",
    why: "Registration brings more people on site, and 8°C outdoor air raises heating load. Both are already in the expectation, so this is not an anomaly.",
    cause: "Student registration period, high occupancy, outdoor temperature of 8°C, and an active teaching schedule.",
    actionLabel: "No action. Keep the current schedule.",
    confidence: 88,
    dailySavingUsd: 0,
    monthlySavingUsd: 0,
    trigger: [{ metric: "context.registrationPeriod", op: "eq", value: true }],
    plan: null,
    opportunity: false,
    contextNotes: ["Student registration period", "High occupancy", "Outdoor temperature: 8°C", "Teaching schedule active"],
  },
  {
    id: "high-occupancy-normal",
    title: "Higher demand matches the event",
    location: "Paramaz Avedisian Building",
    category: "context",
    what: "Demand stepped up with a full lecture hall, and it is still inside the expected band.",
    why: "A high-occupancy event is a reason for higher use, not a fault. The expectation moved with the occupancy.",
    cause: "Lecture hall occupancy is at capacity while HVAC and lighting follow the occupied schedule.",
    actionLabel: "No action. Review again after the event.",
    confidence: 86,
    dailySavingUsd: 0,
    monthlySavingUsd: 0,
    occupancyRoomId: "pab-hall",
    trigger: [{ metric: "context.highOccupancyEvent", op: "eq", value: true }],
    plan: null,
    opportunity: false,
    contextNotes: ["High occupancy event", "Lecture hall at capacity", "Expectation raised with occupancy"],
  },
  {
    id: "floor3-hvac-warning",
    title: "HVAC consumption on Floor 3 is 27% above expected",
    location: "Floor 3 · Main Building",
    category: "opportunity",
    what: "Floor 3 HVAC is drawing more power than the context-adjusted expectation for this hour.",
    why: "Occupancy on the floor is normal, so the extra runtime is not explained by people or weather.",
    cause: "HVAC runtime is significantly higher than historical patterns for the same occupancy, schedule, and outdoor temperature.",
    actionLabel: "Review Floor 3 HVAC runtime and setpoints.",
    confidence: 84,
    dailySavingUsd: 1.4,
    monthlySavingUsd: 42,
    trigger: [{ metric: "floor.main-floor-3.hvacDeviationPct", op: "gte", value: 20 }],
    plan: {
      id: "plan-floor3",
      summary: "Return Floor 3 HVAC to its expected power and Eco-leaning auto mode.",
      actions: [{ type: "set_device", id: "hvac-f3", patch: { powerKw: 8, props: { mode: "eco" } } }],
      expectedDailyUsd: 1.4,
      expectedMonthlyUsd: 42,
      expectedPowerKw: 2.16,
      assumedHoursPerDay: 5,
    },
    opportunity: true,
  },
];

const alerts = [
  {
    id: "alert-floor3-hvac",
    severity: "medium",
    title: "HVAC consumption on Floor 3 is 27% above expected.",
    reason: "Occupancy is normal, but HVAC runtime is significantly higher than historical patterns.",
    recommendation: "Review setpoints and runtime before the next teaching block.",
    location: "Floor 3 · Main Building",
    deviceId: "hvac-f3",
    when: [{ metric: "floor.main-floor-3.hvacDeviationPct", op: "gte", value: 20 }],
  },
  {
    id: "alert-solar-forecast",
    severity: "info",
    title: "Solar generation is expected to exceed building demand by 32 kW between 12:00–14:00.",
    reason: "The midday forecast stays above the expected campus load.",
    recommendation: "Charge the battery.",
    location: "Roof plant",
    when: [{ metric: "solar.currentKw", op: "gt", value: 0 }],
  },
  {
    id: "alert-smartplug-04",
    severity: "high",
    title: "SmartPlug-04 has been disconnected for 8 minutes.",
    reason: "The plug stopped reporting. Its load is no longer metered and cannot be controlled.",
    recommendation: "Check the outlet in Office 301.",
    location: "Office 301",
    deviceId: "smartplug-04",
    when: [{ metric: "device.smartplug-04.status", op: "eq", value: "disconnected" }],
  },
  {
    id: "alert-local-light",
    severity: "low",
    title: "Light-204-03 stayed on because it is locally controlled.",
    reason: "The optimization could not switch a manual device. Someone on site needs to use the wall control.",
    location: "Computer Lab 204",
    deviceId: "light-204-03",
    when: [
      { metric: "occupancy.lab-204", op: "eq", value: 0 },
      { metric: "device.light-204-03.state", op: "eq", value: "on" },
      { metric: "insight.lab-204-unoccupied.applied", op: "eq", value: true },
    ],
  },
];

const rules = [
  {
    id: "rule-empty-lab",
    name: "Empty lab after hours",
    enabled: true,
    priority: 1,
    when: [
      { metric: "occupancy.lab-204", op: "eq", value: 0 },
      { metric: "clock.hour", op: "gte", value: 20 },
    ],
    then: [
      { label: "Turn OFF unused lights", plan: { type: "set_devices", filter: { roomId: "lab-204", type: "lighting", controllable: true }, patch: { state: "off", powerKw: 0 } } },
      { label: "Turn OFF inactive computers", plan: { type: "set_devices", filter: { roomId: "lab-204", type: "computer", controllable: true }, patch: { state: "off", powerKw: 0 } } },
      { label: "Set HVAC → Eco Mode", plan: { type: "set_device", id: "hvac-204", patch: { powerKw: 1.9, props: { mode: "eco" } } } },
    ],
    lastExecution: "2026-10-03T20:05:00+04:00",
    history: [
      { at: "2026-10-03T20:05:00+04:00", result: "Applied. Lab 204 entered Eco. 13 lights and 32 computers switched off." },
      { at: "2026-10-02T20:04:00+04:00", result: "Applied. Lab 204 was already mostly idle." },
    ],
  },
  {
    id: "rule-solar-charge",
    name: "Charge from solar surplus",
    enabled: true,
    priority: 2,
    when: [
      { metric: "solar.surplusKw", op: "gt", value: 20 },
      { metric: "battery.soc", op: "lt", value: 90 },
    ],
    then: [{ label: "Charge Battery", plan: { type: "set_battery", soc: 74, powerKw: -25 } }],
    lastExecution: "2026-10-03T12:10:00+04:00",
    history: [{ at: "2026-10-03T12:10:00+04:00", result: "Charged at 25 kW for the midday surplus window." }],
  },
  {
    id: "rule-peak-reserve",
    name: "Hold battery for the peak",
    enabled: true,
    priority: 3,
    when: [
      { metric: "price.current", op: "gte", value: 0.16 },
      { metric: "battery.soc", op: "gt", value: 30 },
    ],
    then: [{ label: "Discharge battery to the building", plan: { type: "set_battery", powerKw: 30 } }],
    lastExecution: null,
    history: [],
  },
];

const scenarios = [
  {
    id: "lab-unoccupied",
    name: "Lab Becomes Unoccupied",
    description: "Computer Lab 204 empties. Lights, computers, and HVAC stay in the occupied state.",
    expectedInsightId: "lab-204-unoccupied",
    changes: {
      occupancy: { "lab-204": 0 },
      devices: {
        "hvac-204": { state: "on", powerKw: 4.2, props: { mode: "comfort" } },
      },
    },
  },
  {
    id: "solar-surplus",
    name: "Solar Surplus",
    description: "Solar rises to 82 kW while campus demand falls to the midday lull of 51 kW.",
    expectedInsightId: "solar-charge",
    changes: {
      solar: { currentKw: 82 },
      battery: { soc: 63, powerKw: 0 },
      baseload: { "main-building": 0, pab: 0, akian: 0 },
      demandTargetKw: 51,
      devices: {
        "hvac-admin": { state: "off", powerKw: 0, props: { mode: "off" } },
        "hvac-f4": { powerKw: 2.84 },
      },
    },
  },
  {
    id: "peak-price",
    name: "Peak Electricity Price",
    description: "The tariff moves from $0.08 to the $0.16 evening peak.",
    expectedInsightId: "peak-discharge",
    changes: {
      price: { currentUsdPerKwh: 0.16 },
      battery: { powerKw: 0 },
      demandTargetKw: 124,
    },
  },
  {
    id: "device-disconnected",
    name: "Device Disconnected",
    description: "SmartPlug-04 in Office 301 stops reporting.",
    changes: {
      devices: {
        "smartplug-04": { status: "disconnected" },
      },
    },
  },
  {
    id: "unexpected-consumption",
    name: "Unexpected Consumption",
    description: "Floor 3 HVAC rises 27% above its expected power while occupancy stays normal.",
    expectedInsightId: "floor3-hvac-warning",
    changes: {
      devices: {
        "hvac-f3": { state: "on", powerKw: 10.16, props: { mode: "comfort" } },
      },
    },
  },
  {
    id: "high-occupancy",
    name: "High Occupancy Event",
    description: "The Paramaz Avedisian lecture hall fills. Expectation rises with it.",
    expectedInsightId: "high-occupancy-normal",
    changes: {
      occupancy: { "pab-hall": 120 },
      context: { highOccupancyEvent: true },
      devices: {
        "hvac-pab": { state: "on", powerKw: 5.6, props: { mode: "comfort" } },
        "light-pab": { state: "on" },
      },
    },
  },
  {
    id: "registration-period",
    name: "Student Registration Period",
    description: "Registration context explains a high but expected day: 1,760 kWh against 1,820 kWh expected.",
    expectedInsightId: "registration-normal",
    changes: {
      context: {
        registrationPeriod: true,
        highOccupancyEvent: true,
        teachingScheduleActive: true,
        outdoorTempC: 8,
        dailyExpectedKwh: 1820,
        dailyActualKwh: 1760,
        deviationLabel: "6.2% below expected",
      },
      occupancy: { "admin-101": 40, "lobby": 55 },
    },
  },
  {
    id: "battery-nearly-full",
    name: "Battery Nearly Full",
    description: "State of charge reaches 96%, so the charge rule no longer applies.",
    expectedInsightId: "battery-full",
    changes: {
      battery: { soc: 96, powerKw: 0 },
    },
  },
];

// Solar surplus must land campus demand on 51 kW.
// Demand = metered + baseloads. Reduce main baseload by the gap from 124 to 51.
const LOAD = new Set(["lighting", "hvac", "heating", "cooling", "computer", "smart_plug", "water_heater", "elevator"]);
function demandAfter(changes) {
  const baseload = Object.fromEntries(buildings.map((b) => [b.id, b.baseloadKw]));
  Object.assign(baseload, changes.baseload ?? {});
  let sum = Object.values(baseload).reduce((s, n) => s + n, 0);
  for (const d of devices) {
    if (!LOAD.has(d.type)) continue;
    const patch = changes.devices?.[d.id];
    const state = patch?.state ?? d.state;
    const power = patch?.powerKw ?? d.powerKw;
    if (state === "on") sum += power;
  }
  return Math.round(sum * 1000) / 1000;
}
console.log("solar surplus demand", demandAfter(scenarios[1].changes));

const labInsight = insights.find((item) => item.id === "lab-204-unoccupied");
const surplusScenario = scenarios.find((item) => item.id === "solar-surplus");
const chargeAction = insights.find((item) => item.id === "solar-charge").plan.actions.find((action) => action.type === "set_battery");
const peakScenario = scenarios.find((item) => item.id === "peak-price");
const surplusDemandKw = surplusScenario.changes.demandTargetKw;
const surplusKw = surplusScenario.changes.solar.currentKw - surplusDemandKw;

const campus = {
  id: "aua",
  name: "AUA Campus",
  city: "Yerevan",
  timezone: "Asia/Yerevan",
  location: { lat: 40.19272, lng: 44.50339 },
  todayEnergyKwh: 1284,
  todayCostUsd: 143.2,
  baselineSavingsUsd: 38.4,
  baselinePowerKw: 124,
  co2KgPerKwh: 0.233,
  context: {
    season: "Autumn",
    outdoorTempC: 14,
    registrationPeriod: false,
    examPeriod: false,
    teachingScheduleActive: true,
    highOccupancyEvent: false,
    dailyExpectedKwh: null,
    dailyActualKwh: null,
    deviationLabel: null,
  },
  demoStory: [
    { id: "overview", title: "Campus overview", detail: "Start on the command center. Demand, cost, solar, battery, grid, and savings are already live.", route: "/", highlight: "kpi-row" },
    { id: "open-lab", title: "Open Computer Lab 204", detail: "The lab is in session with 24 occupants.", route: "/campus/main-building/main-floor-2/lab-204", highlight: "room-summary" },
    { id: "lab-empty", title: "Lab becomes unoccupied", detail: "Occupancy falls from 24 to 0. Lights, computers, and HVAC stay on.", route: "/campus/main-building/main-floor-2/lab-204", scenarioId: "lab-unoccupied", highlight: "room-summary" },
    { id: "detect", title: "Unnecessary consumption", detail: "The advisor flags the empty lab. This is waste, not a busy hour.", route: "/advisor", highlight: "insight-lab-204-unoccupied" },
    { id: "explain", title: "Why it matters", detail: "Open the explanation: what happened, why, and the cause.", route: "/advisor", highlight: "insight-lab-204-unoccupied" },
    { id: "savings", title: "Estimated savings", detail: `$${labInsight.dailySavingUsd.toFixed(2)} today and $${labInsight.monthlySavingUsd} over the month, at ${labInsight.confidence}% confidence.`, route: "/advisor", highlight: "insight-lab-204-unoccupied" },
    { id: "apply", title: "Apply the optimization", detail: "The rules engine runs the plan. Local-only Light-204-03 is skipped.", route: "/advisor", applyInsightId: "lab-204-unoccupied", highlight: "insight-lab-204-unoccupied" },
    { id: "devices", title: "Devices change state", detail: "Remote lights and inactive computers are off. HVAC-204 is in Eco.", route: "/devices", highlight: "device-table" },
    { id: "power-down", title: "Demand falls", detail: "Campus power and the energy flow both drop by the measured saving.", route: "/", highlight: "kpi-row" },
    { id: "solar", title: "Solar surplus", detail: `Generation stays high while demand falls to ${surplusDemandKw} kW, leaving ${surplusKw} kW of surplus.`, route: "/solar-battery", scenarioId: "solar-surplus", highlight: "strategy-panel" },
    { id: "charge", title: "Battery charges", detail: `Apply the charge plan. State of charge moves from ${surplusScenario.changes.battery.soc}% to ${chargeAction.soc}%.`, route: "/solar-battery", applyInsightId: "solar-charge", highlight: "strategy-panel" },
    { id: "peak", title: "Peak price", detail: `The tariff moves to $${peakScenario.changes.price.currentUsdPerKwh}/kWh for ${prices.peakWindow}.`, route: "/solar-battery", scenarioId: "peak-price", highlight: "peak-panel" },
    { id: "discharge", title: "Battery supplies the building", detail: "Discharge cuts grid import and records the avoided peak cost.", route: "/solar-battery", applyInsightId: "peak-discharge", highlight: "peak-panel" },
    { id: "totals", title: "Savings for the day", detail: "Energy saved and cost avoided, with the daily and monthly projection.", route: "/", highlight: "savings-strip" },
  ],
};

const files = {
  "campus.json": campus,
  "buildings.json": buildings,
  "floors.json": floors,
  "rooms.json": rooms,
  "devices.json": devices,
  "telemetry.json": telemetry,
  "occupancy.json": occupancy,
  "schedules.json": schedules,
  "energy-prices.json": prices,
  "solar.json": solar,
  "battery.json": battery,
  "automation-rules.json": rules,
  "alerts.json": alerts,
  "ai-insights.json": insights,
  "scenarios.json": scenarios,
};

for (const [name, value] of Object.entries(files)) {
  writeFileSync(join(root, name), `${JSON.stringify(value, null, 2)}\n`);
}

console.log("wrote", Object.keys(files).length, "files");
console.log("surplus baseload", scenarios[1].changes.baseload["main-building"]);
