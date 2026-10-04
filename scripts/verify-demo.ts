import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pageTitle } from "../src/components/layout/nav";
import { applyScenario, derive, loadSnapshot, runPlan, type EnergySnapshot } from "../src/lib/engine/model";
import { activeAlerts, activeInsights } from "../src/lib/engine/views";
import { mockDataProvider } from "../src/lib/mock-data";
import type { DemoStoryStep } from "../src/types/energy";

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

const appRoot = join(process.cwd(), "src/app/(dashboard)");
const sourceRoot = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "data" ? [] : sourceFiles(path);
    return entry.name.endsWith(".tsx") || entry.name.endsWith(".ts") ? [path] : [];
  });
}

const source = sourceFiles(sourceRoot).map((path) => readFileSync(path, "utf8")).join("\n");

function routePage(route: string): boolean {
  if (route === "/") return existsSync(join(appRoot, "page.tsx"));
  const [head] = route.split("/").filter(Boolean);
  if (head === "campus") return existsSync(join(appRoot, "campus/[[...path]]/page.tsx"));
  return existsSync(join(appRoot, head ?? "", "page.tsx"));
}

function highlightPresent(id: string): boolean {
  if (id.startsWith("insight-")) {
    const insightId = id.slice("insight-".length);
    return source.includes("insight-${") && mockDataProvider.getAIInsights().some((item) => item.id === insightId);
  }
  return source.includes(`id="${id}"`) || source.includes(`id='${id}'`);
}

function applyStoryStep(current: EnergySnapshot, step: DemoStoryStep): EnergySnapshot {
  let next = current;
  if (step.scenarioId) {
    const scenario = mockDataProvider.getScenarios().find((item) => item.id === step.scenarioId);
    assert(Boolean(scenario), `scenario ${step.scenarioId}`);
    next = applyScenario(next, scenario!);
  }
  if (step.applyInsightId) {
    const insight = mockDataProvider.getAIInsights().find((item) => item.id === step.applyInsightId);
    assert(Boolean(insight?.plan), `insight plan ${step.applyInsightId}`);
    const planned = runPlan(next, insight!.plan!);
    next = {
      ...next,
      devices: planned.devices,
      battery: planned.battery,
      prices: planned.prices,
      appliedInsightIds: [...next.appliedInsightIds, step.applyInsightId],
    };
  }
  return next;
}

let walked = loadSnapshot();
const story = walked.campus.demoStory;
const titles = new Map<string, string>([
  ["/", "Overview"],
  ["/advisor", "AI Advisor"],
  ["/devices", "Devices"],
  ["/solar-battery", "Solar & Battery"],
]);
const expectedIds = ["overview", "open-lab", "lab-empty", "detect", "explain", "savings", "apply", "devices", "power-down", "solar", "charge", "peak", "discharge", "totals"];
assert(story.map((step) => step.id).join(",") === expectedIds.join(","), `story ids ${story.map((step) => step.id).join(",")}`);

for (const step of story) {
  assert(routePage(step.route), `missing page for ${step.route}`);
  const expectedTitle = step.route.startsWith("/campus/") ? "Campus" : titles.get(step.route);
  assert(pageTitle(step.route) === expectedTitle, `title ${step.route} -> ${pageTitle(step.route)}`);
  if (step.highlight) assert(highlightPresent(step.highlight), `highlight ${step.highlight}`);
  if (step.route.startsWith("/campus/")) {
    const [, , buildingId, floorId, roomId] = step.route.split("/");
    if (buildingId) assert(walked.buildings.some((item) => item.id === buildingId), `building ${buildingId}`);
    if (floorId) assert(walked.floors.some((item) => item.id === floorId), `floor ${floorId}`);
    if (roomId) assert(walked.rooms.some((item) => item.id === roomId), `room ${roomId}`);
  }
  walked = applyStoryStep(walked, step);
  const live = derive(walked);
  if (step.id === "savings") {
    const labCopy = mockDataProvider.getAIInsights().find((item) => item.id === "lab-204-unoccupied");
    assert(Boolean(labCopy), "lab copy insight");
    assert(step.detail.includes(`$${labCopy!.dailySavingUsd.toFixed(2)}`), step.detail);
    assert(step.detail.includes(`$${labCopy!.monthlySavingUsd}`), step.detail);
    assert(step.detail.includes(`${labCopy!.confidence}%`), step.detail);
  }
  if (step.id === "solar") {
    assert(Math.abs(live.campusPowerKw - 51) < 0.05, `story demand ${live.campusPowerKw}`);
    assert(Math.abs(live.surplusKw - 31) < 0.05, `story surplus ${live.surplusKw}`);
    assert(step.detail.includes("51 kW") && step.detail.includes("31 kW"), step.detail);
  }
  if (step.id === "charge") {
    const from = mockDataProvider.getScenarios().find((item) => item.id === "solar-surplus")?.changes.battery?.soc;
    const to = mockDataProvider.getAIInsights().find((item) => item.id === "solar-charge")?.plan?.actions.find((action) => action.type === "set_battery");
    assert(from === 63 && to?.soc === 74, "charge endpoints");
    assert(step.detail.includes(`${from}%`) && step.detail.includes(`${to?.soc}%`), step.detail);
    assert(live.batterySoc === 74, `story soc ${live.batterySoc}`);
  }
  if (step.id === "peak") {
    assert(live.priceUsd === 0.16, "story peak price");
    assert(step.detail.includes("$0.16"), step.detail);
  }
}

console.log("demo story checks passed", { power: derived.campusPowerKw, grid: derived.gridImportKw, soc: derived.batterySoc });
