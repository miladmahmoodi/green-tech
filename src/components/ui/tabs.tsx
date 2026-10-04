"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ children }: { children: React.ReactNode }) {
  return <TabsPrimitive.List className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">{children}</TabsPrimitive.List>;
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn("shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-100 dark:data-[state=active]:text-zinc-100")}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export const TabsContent = TabsPrimitive.Content;
