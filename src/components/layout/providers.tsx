"use client";

import { setDeviceTypeCatalog } from "@/lib/format";
import { useEnergyStore } from "@/lib/engine/store";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const deviceTypes = useEnergyStore((state) => state.deviceTypes);
  setDeviceTypeCatalog(deviceTypes);
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
      <Toaster theme="system" />
    </ThemeProvider>
  );
}
