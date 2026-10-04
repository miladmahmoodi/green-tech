import devicesJson from "@/data/devices.json";
import { DeviceDetail } from "@/components/devices/device-detail";
import type { Device } from "@/types/energy";

export function generateStaticParams() {
  return (devicesJson as Device[]).map((device) => ({ id: device.id }));
}

export const dynamicParams = false;

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeviceDetail id={id} />;
}
