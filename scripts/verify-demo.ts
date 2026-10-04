import { applyScenario, derive, loadSnapshot, runPlan } from "../src/lib/engine/model";
import { activeAlerts, activeInsights } from "../src/lib/engine/views";
import { mockDataProvider } from "../src/lib/mock-data";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

let snapshot = loadSnapshot();
let derived = derive(snapshot);
assert(Math.abs(derived.campusPowerKw - 124) < 0.05, `baseline power ${derived.campusPowerKw}`);
assert(derived.solarKw === 82, "solar");
assert(Math.abs(derived.gridImportKw - 42) < 0.05, `grid ${derived.gridImportKw}`);
assert(derived.batterySoc === 67, "soc");
assert(activeInsights(snapshot, derived).length === 0, "no live insights at baseline");

const lab = mockDataProvider.getScenarios().find((item) => item.id === "lab-unoccupied");
assert(Boolean(lab), "lab scenario");
snapshot = applyScenario(snapshot, lab!);
derived = derive(snapshot);
const labInsight = activeInsights(snapshot, derived).find((item) => item.id === "lab-204-unoccupied");
assert(Boolean(labInsight), "lab insight");
assert(labInsight?.occupancy === 0, "occupancy 0");
assert(Math.abs((labInsight?.currentPowerKw ?? 0) - 6.8) < 0.05, `lab power ${labInsight?.currentPowerKw}`);

const plan = mockDataProvider.getAIInsights().find((item) => item.id === "lab-204-unoccupied")?.plan;
assert(Boolean(plan), "plan");
const before = derived.campusPowerKw;
const result = runPlan(snapshot, plan!);
snapshot = { ...snapshot, devices: result.devices, battery: result.battery, prices: result.prices, appliedInsightIds: ["lab-204-unoccupied"] };
derived = derive(snapshot);
assert(derived.campusPowerKw < before - 6, `power drop ${before} -> ${derived.campusPowerKw}`);
const localLight = snapshot.devices.find((device) => device.id === "light-204-03");
assert(localLight?.state === "on", "local light stays on");
assert(snapshot.devices.find((device) => device.id === "pc-204-01")?.state === "off", "pc off");
assert(snapshot.devices.find((device) => device.id === "hvac-204")?.props?.mode === "eco", "hvac eco");
assert(activeAlerts(snapshot, derived).some((alert) => alert.id === "alert-local-light"), "local light alert");

const solar = mockDataProvider.getScenarios().find((item) => item.id === "solar-surplus")!;
snapshot = applyScenario(snapshot, solar);
derived = derive(snapshot);
assert(Math.abs(derived.campusPowerKw - 51) < 0.05, `surplus demand ${derived.campusPowerKw}`);
assert(Math.abs(derived.surplusKw - 31) < 0.05, `surplus ${derived.surplusKw}`);
assert(activeInsights(snapshot, derived).some((item) => item.id === "solar-charge"), "charge insight");

const charge = mockDataProvider.getAIInsights().find((item) => item.id === "solar-charge")!.plan!;
const charged = runPlan(snapshot, charge);
snapshot = { ...snapshot, ...charged, devices: charged.devices, appliedInsightIds: [...snapshot.appliedInsightIds, "solar-charge"] };
derived = derive(snapshot);
assert(derived.batterySoc === 74, `soc ${derived.batterySoc}`);
assert(derived.batteryPowerKw === -25, "charging");

const peak = mockDataProvider.getScenarios().find((item) => item.id === "peak-price")!;
snapshot = applyScenario(snapshot, peak);
derived = derive(snapshot);
const importBefore = derived.gridImportKw;
assert(derived.priceUsd === 0.16, "peak price");
const discharge = mockDataProvider.getAIInsights().find((item) => item.id === "peak-discharge")!.plan!;
const discharged = runPlan(snapshot, discharge);
snapshot = { ...snapshot, battery: discharged.battery, devices: discharged.devices, prices: discharged.prices };
derived = derive(snapshot);
assert(derived.gridImportKw < importBefore, `import ${importBefore} -> ${derived.gridImportKw}`);
assert(derived.batteryPowerKw === 30, "discharging");

console.log("demo story checks passed", { power: derived.campusPowerKw, grid: derived.gridImportKw, soc: derived.batterySoc });
