import { Bell, Building2, Cpu, Gauge, LayoutDashboard, Leaf, SlidersHorizontal, Sparkles, SunMedium, Workflow, Zap, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operate",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/campus", label: "Campus", icon: Building2 },
      { href: "/energy", label: "Energy", icon: Zap },
      { href: "/devices", label: "Devices", icon: Cpu },
    ],
  },
  {
    label: "Decide",
    items: [
      { href: "/advisor", label: "AI Advisor", icon: Sparkles },
      { href: "/optimization", label: "Optimization", icon: Gauge },
      { href: "/automation", label: "Automation", icon: Workflow },
      { href: "/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/solar-battery", label: "Solar & Battery", icon: SunMedium },
      { href: "/analytics", label: "Analytics", icon: Leaf },
      { href: "/configuration", label: "Configuration", icon: SlidersHorizontal },
    ],
  },
];

export function pageTitle(pathname: string): string {
  if (pathname.startsWith("/devices/")) return "Device";
  if (pathname.startsWith("/campus/")) return "Campus";
  const match = navGroups.flatMap((group) => group.items).find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));
  return match?.label ?? "Overview";
}
