import { Badge } from "@/components/ui/badge";
import type { Connectivity, ControlMode, DeviceState } from "@/types/energy";

export function ConnectivityBadge({ status }: { status: Connectivity }) {
  const tone = status === "connected" ? "green" : status === "disconnected" ? "red" : status === "error" ? "amber" : "neutral";
  const label = status === "connected" ? "Connected" : status === "disconnected" ? "Disconnected" : status === "error" ? "Error" : "Unknown";
  return <Badge tone={tone}>{label}</Badge>;
}

export function ControlModeBadge({ mode }: { mode: ControlMode }) {
  const label = mode === "automatic" ? "Automatic" : mode === "scheduled" ? "Scheduled" : "Manual / Local";
  return <Badge tone={mode === "manual" ? "amber" : "neutral"}>{label}</Badge>;
}

export function DeviceStateBadge({ state }: { state: DeviceState }) {
  return <Badge tone={state === "on" ? "blue" : "neutral"}>{state === "on" ? "ON" : "OFF"}</Badge>;
}
