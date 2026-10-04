"use client";

import { DeviceTable } from "@/components/devices/device-table";
import { PageHeader } from "@/components/layout/page-header";
import { useEnergy } from "@/components/energy/use-energy";
import { useRouter } from "next/navigation";

export default function DevicesPage() {
  const { snapshot } = useEnergy();
  const router = useRouter();
  return (
    <div className="space-y-4">
      <PageHeader title="Devices" description="Monitoring and control across the campus. Local devices stay monitoring-only." />
      <DeviceTable snapshot={snapshot} onSelect={(id) => router.push(`/devices/${id}`)} />
    </div>
  );
}
