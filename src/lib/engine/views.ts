import alertsJson from "@/data/alerts.json";
import insightsJson from "@/data/ai-insights.json";
import scenariosJson from "@/data/scenarios.json";
import schedulesJson from "@/data/schedules.json";
import telemetryJson from "@/data/telemetry.json";
import { derive, devicePower, matchesAll, type Derived, type EnergySnapshot } from "@/lib/engine/model";
import type { AIInsight, Alert, AlertSeverity, OptimizationPlan, Scenario, Schedule, Telemetry, TelemetryPoint } from "@/types/energy";

const insights = insightsJson as AIInsight[];
const alerts = alertsJson as Alert[];
const scenarios = scenariosJson as Scenario[];
const schedules = schedulesJson as Schedule[];
const telemetry = telemetryJson as Telemetry;

export interface InsightView {
  id: string;
  title: string;
  location: string;
  category: AIInsight["category"];
  what: string;
  why: string;
  cause: string;
  actionLabel: string;
  confidence: number;
  dailySavingUsd: number;
  monthlySavingUsd: number;
  occupancy: number | null;
  currentPowerKw: number | null;
  wasteKw: number | null;
  plan: OptimizationPlan | null;
  applied: boolean;
  opportunity: boolean;
  contextNotes: string[];
}

export interface AlertView {
  id: string;
  severity: AlertSeverity;
  title: string;
  reason: string;
  recommendation?: string;
  location?: string;
  deviceId?: string;
  acknowledged: boolean;
}

export function catalogScenarios(): Scenario[] {
  return scenarios;
}

export function catalogSchedules(): Schedule[] {
  return schedules;
}

export function catalogOpportunities(): AIInsight[] {
  return insights.filter((insight) => insight.opportunity);
}

export function catalogTelemetry(): Telemetry {
  return telemetry;
}

export function activeInsights(snapshot: EnergySnapshot, derived: Derived = derive(snapshot)): InsightView[] {
  return insights
    .filter((insight) => !insight.standing && matchesAll(snapshot, derived, insight.trigger) && !(insight.suppress?.length && matchesAll(snapshot, derived, insight.suppress)))
    .map((insight) => {
      const roomId = insight.powerRoomId;
      const currentPowerKw = roomId
        ? snapshot.devices
            .filter((device) => device.roomId === roomId && (!insight.powerTypes || insight.powerTypes.includes(device.type)))
            .reduce((sum, device) => sum + devicePower(device), 0)
        : null;
      return {
        id: insight.id,
        title: insight.title,
        location: insight.location,
        category: insight.category,
        what: insight.what,
        why: insight.why,
        cause: insight.cause,
        actionLabel: insight.actionLabel,
        confidence: insight.confidence,
        dailySavingUsd: insight.dailySavingUsd,
        monthlySavingUsd: insight.monthlySavingUsd,
        occupancy: insight.occupancyRoomId ? (derived.peopleByRoom[insight.occupancyRoomId] ?? 0) : null,
        currentPowerKw,
        wasteKw: insight.wasteKw ?? null,
        plan: insight.plan,
        applied: snapshot.appliedInsightIds.includes(insight.id),
        opportunity: insight.opportunity ?? false,
        contextNotes: insight.contextNotes ?? [],
      };
    });
}

export function activeAlerts(snapshot: EnergySnapshot, derived: Derived = derive(snapshot)): AlertView[] {
  return alerts
    .filter((alert) => matchesAll(snapshot, derived, alert.when) && !snapshot.dismissedAlertIds.includes(alert.id))
    .map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      reason: alert.reason,
      recommendation: alert.recommendation,
      location: alert.location,
      deviceId: alert.deviceId,
      acknowledged: snapshot.acknowledgedAlertIds.includes(alert.id),
    }));
}

export function liveSeries(snapshot: EnergySnapshot, derived: Derived, key: string): TelemetryPoint[] {
  const series = telemetry.intraday[key] ?? telemetry.intraday.campus;
  return series.map((point) => (point.t === "10:30" ? { ...point, actual: derived.campusPowerKw, demand: derived.campusPowerKw, solar: derived.solarKw, price: derived.priceUsd, batteryKw: derived.batteryPowerKw } : point));
}

export function sessionSavings(snapshot: EnergySnapshot): { dailyUsd: number; monthlyUsd: number; powerKw: number; kwh: number } {
  return snapshot.savings.reduce(
    (sum, entry) => ({
      dailyUsd: sum.dailyUsd + entry.dailyUsd,
      monthlyUsd: sum.monthlyUsd + entry.monthlyUsd,
      powerKw: sum.powerKw + entry.powerKw,
      kwh: sum.kwh + entry.powerKw * 8.7,
    }),
    { dailyUsd: 0, monthlyUsd: 0, powerKw: 0, kwh: 0 },
  );
}
