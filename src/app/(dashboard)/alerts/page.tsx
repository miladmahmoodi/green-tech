"use client";

import { AlertCard } from "@/components/alerts/alert-card";
import { useEnergy } from "@/components/energy/use-energy";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { useEnergyStore } from "@/lib/engine/store";
import type { AlertSeverity } from "@/types/energy";

const order: AlertSeverity[] = ["critical", "high", "medium", "low", "info"];

export default function AlertsPage() {
  const { alerts } = useEnergy();
  const acknowledge = useEnergyStore((state) => state.acknowledgeAlert);
  const dismiss = useEnergyStore((state) => state.dismissAlert);
  return (
    <div className="space-y-5">
      <PageHeader title="Alerts" description="Only conditions that are true right now. A busy registration day does not raise an alarm." />
      {alerts.length === 0 ? <Card className="p-4 text-sm text-zinc-500">No open alerts.</Card> : null}
      {order.map((severity) => {
        const group = alerts.filter((alert) => alert.severity === severity);
        if (group.length === 0) return null;
        return (
          <section key={severity} className="space-y-2">
            <h2 className="text-xs uppercase tracking-[0.14em] text-zinc-500">{severity}</h2>
            {group.map((alert) => <AlertCard key={alert.id} alert={alert} onAcknowledge={acknowledge} onDismiss={dismiss} />)}
          </section>
        );
      })}
    </div>
  );
}
