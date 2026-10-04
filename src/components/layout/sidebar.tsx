"use client";

import { useEnergy } from "@/components/energy/use-energy";
import { navGroups } from "@/components/layout/nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const { alerts } = useEnergy();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 md:flex dark:border-zinc-800 dark:bg-zinc-950">
      <div className="px-4 py-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">iBEMS</p>
        <p className="mt-1 text-sm font-medium">Energy Command Center</p>
        <p className="text-xs text-zinc-500">AUA · Yerevan</p>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2" aria-label="Primary">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500", active ? "bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-900")}>
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                    {item.href === "/alerts" && alerts.length > 0 ? <span className="num ml-auto text-xs text-zinc-500">{alerts.length}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
