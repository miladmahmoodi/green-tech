import buildingsJson from "@/data/buildings.json";
import floorsJson from "@/data/floors.json";
import roomsJson from "@/data/rooms.json";
import { CampusExplorer } from "@/components/campus/campus-explorer";
import type { Building, Floor, Room } from "@/types/energy";

export function generateStaticParams() {
  const buildings = buildingsJson as Building[];
  const floors = floorsJson as Floor[];
  const rooms = roomsJson as Room[];
  const params: { path: string[] }[] = [{ path: [] }];
  for (const building of buildings) {
    params.push({ path: [building.id] });
    for (const floor of floors.filter((item) => item.buildingId === building.id)) {
      params.push({ path: [building.id, floor.id] });
      for (const room of rooms.filter((item) => item.floorId === floor.id)) {
        params.push({ path: [building.id, floor.id, room.id] });
      }
    }
  }
  return params;
}

export default async function CampusPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return <CampusExplorer path={path} />;
}
