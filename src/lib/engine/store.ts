"use client";

import { mockDataProvider } from "@/lib/mock-data";
import { applyScenario, derive, loadSnapshot, matchesAll, runPlan, type EnergySnapshot } from "@/lib/engine/model";
import { activeInsights } from "@/lib/engine/views";
import type { AutomationRule, Device, DevicePatch, EnergyPrices } from "@/types/energy";
import { create } from "zustand";

interface EnergyStore extends EnergySnapshot {
  demoOpen: boolean;
  reset: () => void;
  applyScenarioById: (id: string) => void;
  applyInsight: (id: string) => string[];
  setDevice: (id: string, patch: DevicePatch) => string | null;
  addDevice: (device: Device) => void;
  updatePrices: (patch: Partial<EnergyPrices>) => void;
  toggleRule: (id: string) => void;
  addRule: (rule: AutomationRule) => void;
  runRule: (id: string) => string[];
  dismissAlert: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  setDemoOpen: (open: boolean) => void;
  setHighlight: (id: string | null) => void;
  goToStoryStep: (index: number) => string;
  tick: () => void;
}

const STORE_ACTIONS = [
  "demoOpen",
  "reset",
  "applyScenarioById",
  "applyInsight",
  "setDevice",
  "addDevice",
  "updatePrices",
  "toggleRule",
  "addRule",
  "runRule",
  "dismissAlert",
  "acknowledgeAlert",
  "setDemoOpen",
  "setHighlight",
  "goToStoryStep",
  "tick",
] as const;

function snapshotOf(state: EnergyStore): EnergySnapshot {
  const snapshot = { ...state };
  for (const key of STORE_ACTIONS) delete snapshot[key];
  return snapshot;
}

function withSavings(snapshot: EnergySnapshot, insightId: string): { snapshot: EnergySnapshot; notes: string[] } {
  const insight = activeInsights(snapshot).find((item) => item.id === insightId) ?? activeInsights({ ...snapshot, appliedInsightIds: [] }).find((item) => item.id === insightId);
  const catalog = mockDataProvider.getAIInsights().find((item) => item.id === insightId);
  const plan = catalog?.plan;
  if (!plan) return { snapshot, notes: ["This insight has no action plan."] };
  if (snapshot.appliedInsightIds.includes(insightId)) return { snapshot, notes: ["Already applied."] };
  const result = runPlan(snapshot, plan);
  const notes = result.skipped.map((item) => `${item.deviceName}: ${item.reason}`);
  const reducesLoad = plan.actions.some((action) => action.type === "set_device" || action.type === "set_devices");
  return {
    snapshot: {
      ...snapshot,
      devices: result.devices,
      battery: result.battery,
      prices: result.prices,
      appliedInsightIds: [...snapshot.appliedInsightIds, insightId],
      savings: [
        ...snapshot.savings,
        {
          id: plan.id,
          at: snapshot.demoNow,
          source: insight?.location ?? catalog?.location ?? plan.summary,
          powerKw: reducesLoad ? result.deltaKw : 0,
          dailyUsd: plan.expectedDailyUsd,
          monthlyUsd: plan.expectedMonthlyUsd,
          note: plan.summary,
        },
      ],
      rules: snapshot.rules.map((rule) =>
        rule.enabled && matchesAll(snapshot, derive(snapshot), rule.when)
          ? {
              ...rule,
              lastExecution: snapshot.demoNow,
              history: [{ at: snapshot.demoNow, result: plan.summary }, ...rule.history].slice(0, 8),
            }
          : rule,
      ),
    },
    notes,
  };
}

export const useEnergyStore = create<EnergyStore>((set, get) => ({
  ...loadSnapshot(),
  demoOpen: false,
  reset: () => set({ ...loadSnapshot(), demoOpen: get().demoOpen }),
  applyScenarioById: (id) => {
    const scenario = mockDataProvider.getScenarios().find((item) => item.id === id);
    if (!scenario) return;
    set(applyScenario(snapshotOf(get()), scenario));
  },
  applyInsight: (id) => {
    const { snapshot, notes } = withSavings(get(), id);
    set(snapshot);
    return notes;
  },
  setDevice: (id, patch) => {
    const device = get().devices.find((item) => item.id === id);
    if (!device) return "Device not found.";
    const probe = runPlan(get(), {
      id: `manual-${id}`,
      summary: "Manual control",
      actions: [{ type: "set_device", id, patch }],
      expectedDailyUsd: 0,
      expectedMonthlyUsd: 0,
      expectedPowerKw: 0,
      assumedHoursPerDay: 0,
    });
    if (probe.skipped.length > 0) return probe.skipped[0]?.reason ?? "Remote control is unavailable.";
    set({ devices: probe.devices });
    return null;
  },
  addDevice: (device) => set({ devices: [...get().devices, device] }),
  updatePrices: (patch) => set({ prices: { ...get().prices, ...patch } }),
  toggleRule: (id) =>
    set({
      rules: get().rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)),
    }),
  addRule: (rule) => set({ rules: [...get().rules, rule] }),
  runRule: (id) => {
    const rule = get().rules.find((item) => item.id === id);
    if (!rule || !rule.enabled) return ["Rule is disabled."];
    if (!matchesAll(get(), derive(get()), rule.when)) return ["Conditions are not met."];
    let snapshot = get();
    const notes: string[] = [];
    const plan = {
      id: `rule-${rule.id}-${snapshot.demoNow}`,
      summary: rule.then.map((step) => step.label).join(". "),
      actions: rule.then.map((step) => step.plan),
      expectedDailyUsd: 0,
      expectedMonthlyUsd: 0,
      expectedPowerKw: 0,
      assumedHoursPerDay: 0,
    };
    const result = runPlan(snapshot, plan);
    notes.push(...result.skipped.map((item) => `${item.deviceName}: ${item.reason}`));
    snapshot = {
      ...snapshot,
      devices: result.devices,
      battery: result.battery,
      prices: result.prices,
      rules: snapshot.rules.map((item) =>
        item.id === rule.id
          ? { ...item, lastExecution: snapshot.demoNow, history: [{ at: snapshot.demoNow, result: "Ran from the rule builder." }, ...item.history].slice(0, 8) }
          : item,
      ),
    };
    set(snapshot);
    return notes;
  },
  dismissAlert: (id) => set({ dismissedAlertIds: [...get().dismissedAlertIds, id] }),
  acknowledgeAlert: (id) => set({ acknowledgedAlertIds: [...new Set([...get().acknowledgedAlertIds, id])] }),
  setDemoOpen: (open) => set({ demoOpen: open }),
  setHighlight: (id) => set({ highlight: id }),
  goToStoryStep: (index) => {
    const story = get().campus.demoStory;
    const step = story[index];
    if (!step) return "/";
    if (step.scenarioId) get().applyScenarioById(step.scenarioId);
    if (step.applyInsightId) get().applyInsight(step.applyInsightId);
    set({ storyIndex: index, highlight: step.highlight ?? null });
    return step.route;
  },
  tick: () => {
    const next = new Date(Date.parse(get().demoNow) + 2000).toISOString();
    set({
      demoNow: next,
      devices: get().devices.map((device) =>
        device.status === "connected" ? { ...device, lastSeen: new Date(Date.parse(device.lastSeen) + 2000).toISOString() } : device,
      ),
    });
  },
}));

export function useDerived() {
  return useEnergyStore((state) => derive(state));
}
