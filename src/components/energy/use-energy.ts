"use client";

import { derive } from "@/lib/engine/model";
import { useEnergyStore } from "@/lib/engine/store";
import { activeAlerts, activeInsights, sessionSavings } from "@/lib/engine/views";
import { useMemo } from "react";

export function useEnergy() {
  const snapshot = useEnergyStore();
  return useMemo(() => {
    const derived = derive(snapshot);
    return {
      snapshot,
      derived,
      insights: activeInsights(snapshot, derived),
      alerts: activeAlerts(snapshot, derived),
      savings: sessionSavings(snapshot),
    };
  }, [snapshot]);
}
