export type DeviceType =
  | "electricity_meter"
  | "lighting"
  | "hvac"
  | "heating"
  | "cooling"
  | "computer"
  | "smart_plug"
  | "water_heater"
  | "elevator"
  | "solar_panel"
  | "solar_inverter"
  | "battery";

export type Connectivity = "connected" | "disconnected" | "error" | "unknown";

export type ControlMode = "automatic" | "scheduled" | "manual";

export type DeviceState = "on" | "off";

export type HvacMode = "auto" | "eco" | "comfort" | "off";

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ZoneType =
  | "lab"
  | "classroom"
  | "office"
  | "administration"
  | "common"
  | "restroom"
  | "library"
  | "plant"
  | "elevator";

/** Device types that draw from the building electrical load. */
export const LOAD_DEVICE_TYPES: DeviceType[] = [
  "lighting",
  "hvac",
  "heating",
  "cooling",
  "computer",
  "smart_plug",
  "water_heater",
  "elevator",
];

export interface CampusContext {
  season: string;
  outdoorTempC: number;
  registrationPeriod: boolean;
  examPeriod: boolean;
  teachingScheduleActive: boolean;
  highOccupancyEvent: boolean;
  /** When set, the campus day comparison uses these figures instead of the model. */
  dailyExpectedKwh: number | null;
  dailyActualKwh: number | null;
  /** Presenter copy for the context status, used when the demo states a specific figure. */
  deviationLabel: string | null;
}

export interface DemoStoryStep {
  id: string;
  title: string;
  detail: string;
  route: string;
  /** Scenario to activate when the presenter advances onto this step. */
  scenarioId?: string;
  /** Insight whose plan is applied when the presenter advances onto this step. */
  applyInsightId?: string;
  /** Element id highlighted on the page. */
  highlight?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface CatalogType {
  id: string;
  label: string;
}

export interface Tariff {
  id: string;
  name: string;
  offPeakUsdPerKwh: number;
  peakUsdPerKwh: number;
  peakWindow: string;
  currentUsdPerKwh: number;
  active: boolean;
}

export interface Campus {
  id: string;
  name: string;
  city: string;
  timezone: string;
  location: GeoPoint | null;
  todayEnergyKwh: number;
  todayCostUsd: number;
  baselineSavingsUsd: number;
  baselinePowerKw: number;
  co2KgPerKwh: number;
  context: CampusContext;
  demoStory: DemoStoryStep[];
}

export interface Building {
  id: string;
  campusId: string;
  name: string;
  code: string;
  /** Unmetered load that is not represented by individual devices. */
  baseloadKw: number;
  areaM2: number;
  location: GeoPoint | null;
}

export interface Floor {
  id: string;
  buildingId: string;
  name: string;
  level: number;
}

export interface Room {
  id: string;
  floorId: string;
  buildingId: string;
  name: string;
  zoneType: ZoneType;
  areaM2: number;
  capacity: number;
}

export interface ZoneGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorPlanZone {
  id: string;
  name: string;
  type: string;
  geometry: ZoneGeometry;
  deviceIds: string[];
}

export interface FloorPlan {
  floorId: string;
  buildingId: string;
  floorPlan: string;
  width: number;
  height: number;
  zones: FloorPlanZone[];
}

export interface DeviceProps {
  mode?: HvacMode;
  setpointC?: number;
  currentTempC?: number;
  targetTempC?: number;
  ecoPowerKw?: number;
  comfortPowerKw?: number;
  standbyPowerKw?: number;
  schedule?: string[];
  plugCategory?: string;
  tripsToday?: number;
  peakKw?: number;
  energyTodayKwh?: number;
  expectedPowerKw?: number;
  ratedPowerKw?: number;
  groupSize?: number;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  buildingId: string;
  floorId: string;
  roomId: string;
  status: Connectivity;
  controlMode: ControlMode;
  controllable: boolean;
  state: DeviceState;
  powerKw: number;
  lastSeen: string;
  props?: DeviceProps;
}

export interface TelemetryPoint {
  t: string;
  actual: number;
  expected: number;
  baseline: number;
  solar: number;
  price: number;
  batteryKw: number;
  demand: number;
}

export interface HistoryPoint {
  label: string;
  kwh: number;
  cost: number;
  solarKwh: number;
  batteryKwh: number;
  savingsUsd: number;
  co2Kg: number;
  peakKw: number;
}

export interface Telemetry {
  intraday: Record<string, TelemetryPoint[]>;
  daily: HistoryPoint[];
  weekly: HistoryPoint[];
  monthly: HistoryPoint[];
}

export interface OccupancyRecord {
  roomId: string;
  people: number;
  capacity: number;
}

export interface Schedule {
  id: string;
  name: string;
  scope: string;
  windows: string[];
  notes: string;
}

export interface PricePoint {
  t: string;
  usdPerKwh: number;
}

export interface EnergyPrices {
  currency: string;
  unit: string;
  offPeakUsdPerKwh: number;
  peakUsdPerKwh: number;
  peakWindow: string;
  currentUsdPerKwh: number;
  curve: PricePoint[];
}

export interface SolarCurvePoint {
  t: string;
  generationKw: number;
  demandKw: number;
  priceUsd: number;
  batteryKw: number;
}

export interface SolarSystem {
  capacityKw: number;
  currentKw: number;
  inverterId: string;
  inverterStatus: Connectivity;
  curve: SolarCurvePoint[];
}

export interface BatterySystem {
  capacityKwh: number;
  soc: number;
  /** Positive discharges to the building. Negative charges from surplus. */
  powerKw: number;
  maxChargeKw: number;
  maxDischargeKw: number;
  reserveSoc: number;
  status: Connectivity;
}

export type Comparator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";

export interface Condition {
  metric: string;
  op: Comparator;
  value: number | string | boolean;
}

export interface DeviceFilter {
  roomId?: string;
  floorId?: string;
  buildingId?: string;
  type?: DeviceType;
  controllable?: boolean;
  state?: DeviceState;
}

export type PlanAction =
  | { type: "set_devices"; filter: DeviceFilter; patch: DevicePatch }
  | { type: "set_device"; id: string; patch: DevicePatch }
  | { type: "set_battery"; soc?: number; powerKw?: number }
  | { type: "set_price"; currentUsdPerKwh: number };

export interface DevicePatch {
  state?: DeviceState;
  powerKw?: number;
  status?: Connectivity;
  controlMode?: ControlMode;
  props?: DeviceProps;
}

export interface OptimizationPlan {
  id: string;
  summary: string;
  actions: PlanAction[];
  /** Presented savings. The ledger also records the measured power delta. */
  expectedDailyUsd: number;
  expectedMonthlyUsd: number;
  expectedPowerKw: number;
  assumedHoursPerDay: number;
}

export interface RuleAction {
  label: string;
  plan: PlanAction;
}

export interface RuleExecution {
  at: string;
  result: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  when: Condition[];
  then: RuleAction[];
  lastExecution: string | null;
  history: RuleExecution[];
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  reason: string;
  recommendation?: string;
  when: Condition[];
  deviceId?: string;
  location?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  location: string;
  category: "opportunity" | "context" | "strategy";
  what: string;
  why: string;
  cause: string;
  actionLabel: string;
  confidence: number;
  dailySavingUsd: number;
  monthlySavingUsd: number;
  /** Room whose occupancy is shown on the card. */
  occupancyRoomId?: string;
  /** Device types summed for the "current power" figure. Defaults to all room loads. */
  powerTypes?: DeviceType[];
  powerRoomId?: string;
  wasteKw?: number;
  trigger: Condition[];
  /** Hide when any of these match. */
  suppress?: Condition[];
  plan: OptimizationPlan | null;
  opportunity?: boolean;
  /** Shown in the Optimization Center even when the live trigger is quiet. */
  standing?: boolean;
  contextNotes?: string[];
}

export interface ScenarioChanges {
  occupancy?: Record<string, number>;
  devices?: Record<string, DevicePatch>;
  baseload?: Record<string, number>;
  solar?: Partial<Pick<SolarSystem, "currentKw">>;
  battery?: Partial<Pick<BatterySystem, "soc" | "powerKw">>;
  price?: Partial<Pick<EnergyPrices, "currentUsdPerKwh">>;
  context?: Partial<CampusContext>;
  /** After other patches, shift the main building baseload so campus demand lands on this value. */
  demandTargetKw?: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  changes: ScenarioChanges;
  expectedInsightId?: string;
}

export interface SavingsEntry {
  id: string;
  at: string;
  source: string;
  powerKw: number;
  dailyUsd: number;
  monthlyUsd: number;
  note: string;
}

export interface SkippedCommand {
  deviceId: string;
  deviceName: string;
  reason: string;
}
