"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useEnergy } from "@/components/energy/use-energy";
import { derive, matchesAll } from "@/lib/engine/model";
import { useEnergyStore } from "@/lib/engine/store";
import type { AutomationRule, Condition, PlanAction } from "@/types/energy";
import { useState } from "react";
import { toast } from "sonner";

const ACTION_PRESETS: { label: string; plan: PlanAction }[] = [
  { label: "Turn OFF unused lights", plan: { type: "set_devices", filter: { roomId: "lab-204", type: "lighting", controllable: true }, patch: { state: "off", powerKw: 0 } } },
  { label: "Turn OFF inactive computers", plan: { type: "set_devices", filter: { roomId: "lab-204", type: "computer", controllable: true }, patch: { state: "off", powerKw: 0 } } },
  { label: "Set HVAC → Eco Mode", plan: { type: "set_device", id: "hvac-204", patch: { powerKw: 1.9, props: { mode: "eco" } } } },
  { label: "Charge Battery", plan: { type: "set_battery", powerKw: -25 } },
];

export default function AutomationPage() {
  const { snapshot } = useEnergy();
  const toggleRule = useEnergyStore((state) => state.toggleRule);
  const addRule = useEnergyStore((state) => state.addRule);
  const runRule = useEnergyStore((state) => state.runRule);
  const [name, setName] = useState("Custom occupancy rule");
  const [metric, setMetric] = useState("occupancy.lab-204");
  const [op, setOp] = useState<Condition["op"]>("eq");
  const [value, setValue] = useState("0");
  const [picked, setPicked] = useState<string[]>(["Turn OFF unused lights"]);
  const derived = derive(snapshot);

  const save = () => {
    const numeric = Number(value);
    const conditionValue = Number.isNaN(numeric) ? value : numeric;
    const rule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name,
      enabled: true,
      priority: snapshot.rules.length + 1,
      when: [{ metric, op, value: conditionValue }],
      then: ACTION_PRESETS.filter((preset) => picked.includes(preset.label)).map((preset) => ({ label: preset.label, plan: preset.plan })),
      lastExecution: null,
      history: [],
    };
    if (rule.then.length === 0) {
      toast.error("Choose at least one action");
      return;
    }
    addRule(rule);
    toast.success("Rule added to the runtime policy set");
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-medium">Automation</h1>
        <p className="text-sm text-zinc-500">Rules evaluate after each change. Running one goes through the same optimizer as the advisor.</p>
      </header>
      <Card className="p-4">
        <h2 className="text-sm font-medium">Rule builder</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2 text-sm">
          <label className="text-xs text-zinc-500">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block h-9 rounded-lg border border-zinc-300 bg-transparent px-2 dark:border-zinc-700" /></label>
          <span className="pb-2 text-xs uppercase tracking-wide text-zinc-500">When</span>
          <input aria-label="Condition metric" value={metric} onChange={(event) => setMetric(event.target.value)} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 dark:border-zinc-700" />
          <select aria-label="Comparator" value={op} onChange={(event) => setOp(event.target.value as Condition["op"])} className="h-9 rounded-lg border border-zinc-300 bg-transparent px-2 dark:border-zinc-700">
            {["eq", "neq", "gt", "gte", "lt", "lte"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input aria-label="Condition value" value={value} onChange={(event) => setValue(event.target.value)} className="h-9 w-20 rounded-lg border border-zinc-300 bg-transparent px-2 dark:border-zinc-700" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTION_PRESETS.map((preset) => {
            const on = picked.includes(preset.label);
            return (
              <button key={preset.label} type="button" onClick={() => setPicked((current) => on ? current.filter((item) => item !== preset.label) : [...current, preset.label])} className={`rounded-full border px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${on ? "border-violet-500 text-violet-500" : "border-zinc-300 text-zinc-500 dark:border-zinc-700"}`}>
                {on ? "AND " : ""}{preset.label}
              </button>
            );
          })}
        </div>
        <Button className="mt-3" size="sm" onClick={save}>Save rule</Button>
      </Card>
      <div className="space-y-3">
        {snapshot.rules.map((rule) => {
          const met = rule.enabled && matchesAll(snapshot, derived, rule.when);
          return (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-500">Priority {rule.priority}</p>
                  <h2 className="font-medium">{rule.name}</h2>
                </div>
                <Switch checked={rule.enabled} label={`Toggle ${rule.name}`} onCheckedChange={() => toggleRule(rule.id)} />
              </div>
              <p className="mt-3 text-sm"><span className="text-zinc-500">WHEN </span>{rule.when.map((condition) => `${condition.metric} ${condition.op} ${String(condition.value)}`).join(" AND ")}</p>
              <p className="mt-1 text-sm"><span className="text-zinc-500">THEN </span>{rule.then.map((step) => step.label).join(" AND ")}</p>
              <p className="mt-2 text-xs text-zinc-500">{met ? "Conditions met" : "Conditions not met"} · last run {rule.lastExecution ? new Date(rule.lastExecution).toLocaleString("en-GB", { hour12: false, timeZone: "Asia/Yerevan" }) : "never"}</p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                {rule.history.slice(0, 3).map((entry) => <li key={entry.at}>{entry.result}</li>)}
              </ul>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => { const notes = runRule(rule.id); notes.forEach((note) => toast.message(note)); if (notes.length === 0) toast.success("Rule executed"); }}>Run now</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
