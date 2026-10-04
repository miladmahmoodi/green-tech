"use client";

import { PresenterConsole } from "@/components/layout/presenter-console";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useEnergyStore } from "@/lib/engine/store";
import { useEffect } from "react";

export function Shell({ children }: { children: React.ReactNode }) {
  const tick = useEnergyStore((state) => state.tick);
  useEffect(() => {
    const timer = window.setInterval(tick, 2000);
    return () => window.clearInterval(timer);
  }, [tick]);
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-5 lg:px-8">{children}</main>
      </div>
      <PresenterConsole />
    </div>
  );
}
