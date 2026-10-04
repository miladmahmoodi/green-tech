"use client";

import { Switch } from "@/components/ui/switch";
import { useEnergy } from "@/components/energy/use-energy";
import { navGroups, pageTitle } from "@/components/layout/nav";
import { formatClock, formatMoney } from "@/lib/format";
import { useEnergyStore } from "@/lib/engine/store";
import { Menu, Moon, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Topbar() {
  const { snapshot, derived } = useEnergy();
  const setDemoOpen = useEnergyStore((state) => state.setDemoOpen);
  const demoOpen = useEnergyStore((state) => state.demoOpen);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => setThemeReady(true), []);
  const light = themeReady && theme === "light";
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <button type="button" className="rounded-md p-2 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" aria-label="Open navigation" onClick={() => setNavOpen((value) => !value)}>
        <Menu className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{pageTitle(pathname)}</p>
        <p className="text-xs text-zinc-500">{snapshot.campus.name} · {formatClock(snapshot.demoNow)} · {snapshot.campus.city}</p>
      </div>
      <span className={`num rounded-full px-2.5 py-1 text-xs ${derived.isPeak ? "bg-amber-500/15 text-amber-600" : "bg-blue-500/10 text-blue-600 dark:text-blue-300"}`}>
        {formatMoney(derived.priceUsd).replace("$", "$")}/kWh {derived.isPeak ? "peak" : "off-peak"}
      </span>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="hidden sm:inline">Demo mode</span>
        <Switch checked={demoOpen} onCheckedChange={setDemoOpen} label="Demo mode" />
      </div>
      <button type="button" aria-label="Toggle color theme" className="rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500" onClick={() => setTheme(light ? "dark" : "light")}>
        {light ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
      </button>
      {navOpen ? (
        <nav className="absolute left-0 top-full z-40 w-full border-b border-zinc-200 bg-white p-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950" aria-label="Mobile">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-2 text-[10px] uppercase tracking-[0.16em] text-zinc-400">{group.label}</p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-md px-2 py-2 text-sm" onClick={() => setNavOpen(false)}>{item.label}</Link>
              ))}
            </div>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
