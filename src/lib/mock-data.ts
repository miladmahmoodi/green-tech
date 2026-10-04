import alertsJson from "@/data/alerts.json";
import insightsJson from "@/data/ai-insights.json";
import rulesJson from "@/data/automation-rules.json";
import batteryJson from "@/data/battery.json";
import buildingsJson from "@/data/buildings.json";
import campusJson from "@/data/campus.json";
import devicesJson from "@/data/devices.json";
import pricesJson from "@/data/energy-prices.json";
import floorPlansJson from "@/data/floor-plans.json";
import floorsJson from "@/data/floors.json";
import occupancyJson from "@/data/occupancy.json";
import roomsJson from "@/data/rooms.json";
import scenariosJson from "@/data/scenarios.json";
import schedulesJson from "@/data/schedules.json";
import solarJson from "@/data/solar.json";
import telemetryJson from "@/data/telemetry.json";
import type {
  AIInsight,
  Alert,
  AutomationRule,
  BatterySystem,
  Building,
  Campus,
  Device,
  EnergyPrices,
  Floor,
  FloorPlan,
  OccupancyRecord,
  Room,
  Scenario,
  Schedule,
  SolarSystem,
  Telemetry,
} from "@/types/energy";

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Read-only access to the JSON mock catalog.
 * A future ApiDataProvider can implement the same methods without UI changes.
 */
export interface DataProvider {
  getCampus(): Campus;
  getBuildings(): Building[];
  getFloors(): Floor[];
  getRooms(): Room[];
  getDevices(): Device[];
  getTelemetry(): Telemetry;
  getOccupancy(): OccupancyRecord[];
  getSchedules(): Schedule[];
  getEnergyPrices(): EnergyPrices;
  getSolarData(): SolarSystem;
  getBatteryData(): BatterySystem;
  getAutomationRules(): AutomationRule[];
  getAlerts(): Alert[];
  getAIInsights(): AIInsight[];
  getScenarios(): Scenario[];
  getFloorPlans(): FloorPlan[];
}

export const mockDataProvider: DataProvider = {
  getCampus: () => clone(campusJson as Campus),
  getBuildings: () => clone(buildingsJson as Building[]),
  getFloors: () => clone(floorsJson as Floor[]),
  getRooms: () => clone(roomsJson as Room[]),
  getDevices: () => clone(devicesJson as Device[]),
  getTelemetry: () => clone(telemetryJson as Telemetry),
  getOccupancy: () => clone(occupancyJson as OccupancyRecord[]),
  getSchedules: () => clone(schedulesJson as Schedule[]),
  getEnergyPrices: () => clone(pricesJson as EnergyPrices),
  getSolarData: () => clone(solarJson as SolarSystem),
  getBatteryData: () => clone(batteryJson as BatterySystem),
  getAutomationRules: () => clone(rulesJson as AutomationRule[]),
  getAlerts: () => clone(alertsJson as Alert[]),
  getAIInsights: () => clone(insightsJson as AIInsight[]),
  getScenarios: () => clone(scenariosJson as Scenario[]),
  getFloorPlans: () => clone(floorPlansJson as FloorPlan[]),
};

export function getBuildings(): Building[] {
  return mockDataProvider.getBuildings();
}
export function getFloors(): Floor[] {
  return mockDataProvider.getFloors();
}
export function getRooms(): Room[] {
  return mockDataProvider.getRooms();
}
export function getDevices(): Device[] {
  return mockDataProvider.getDevices();
}
export function getTelemetry(): Telemetry {
  return mockDataProvider.getTelemetry();
}
export function getOccupancy(): OccupancyRecord[] {
  return mockDataProvider.getOccupancy();
}
export function getEnergyPrices(): EnergyPrices {
  return mockDataProvider.getEnergyPrices();
}
export function getSolarData(): SolarSystem {
  return mockDataProvider.getSolarData();
}
export function getBatteryData(): BatterySystem {
  return mockDataProvider.getBatteryData();
}
export function getAlerts(): Alert[] {
  return mockDataProvider.getAlerts();
}
export function getAIInsights(): AIInsight[] {
  return mockDataProvider.getAIInsights();
}
export function getScenarios(): Scenario[] {
  return mockDataProvider.getScenarios();
}
