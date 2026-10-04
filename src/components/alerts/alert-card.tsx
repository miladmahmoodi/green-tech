import { Badge } from "@/components/ui/badge";
import type { AlertView } from "@/lib/engine/views";
import type { AlertSeverity } from "@/types/energy";

const tone: Record<AlertSeverity, "red" | "amber" | "blue" | "neutral" | "violet"> = {
  critical: "red",
  high: "red",
  medium: "amber",
  low: "neutral",
  info: "blue",
};

export function AlertCard({ alert, onAcknowledge, onDismiss }: { alert: AlertView; onAcknowledge: (id: string) => void; onDismiss: (id: string) => void }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <Badge tone={tone[alert.severity]}>{alert.severity}</Badge>
        {alert.acknowledged ? <Badge>Acknowledged</Badge> : null}
        {alert.location ? <span className="text-xs text-zinc-500">{alert.location}</span> : null}
      </div>
      <h3 className="mt-2 text-sm font-medium">{alert.title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{alert.reason}</p>
      {alert.recommendation ? <p className="mt-2 text-sm">Recommendation: {alert.recommendation}</p> : null}
      <div className="mt-3 flex gap-3 text-xs">
        <button type="button" className="text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-zinc-100" onClick={() => onAcknowledge(alert.id)}>Acknowledge</button>
        <button type="button" className="text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:text-zinc-100" onClick={() => onDismiss(alert.id)}>Dismiss</button>
      </div>
    </article>
  );
}
