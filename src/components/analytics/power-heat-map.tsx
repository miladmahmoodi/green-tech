"use client";

import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import { BuildingHeatList } from "@/components/campus/building-heat-list";
import { HeatLegend } from "@/components/charts/heat-legend";
import { YANDEX_TILES } from "@/components/configuration/campus-map";
import { formatPower } from "@/lib/format";
import { HEAT_GRADIENT } from "@/lib/heat";
import type { Building } from "@/types/energy";

const AUA: [number, number] = [40.19272, 44.50339];

function labelIcon(name: string, power: string): L.DivIcon {
  const label = `${escapeHtml(name)} · ${escapeHtml(power)}`;
  return L.divIcon({
    className: "power-heat-pin",
    html: `<span style="display:inline-block;transform:translate(-50%,-50%);padding:3px 8px;border-radius:999px;background:#18181b;color:#fff;font:600 11px/1.3 ui-sans-serif,system-ui,sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.45)">${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function HeatField({ points }: { points: L.HeatLatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    const layer = L.heatLayer(points, {
      radius: 80,
      blur: 35,
      maxZoom: 18,
      max: 1,
      minOpacity: 0.4,
      gradient: HEAT_GRADIENT,
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);
  return null;
}

function FocusView({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center ?? AUA, center ? 18 : 17, { duration: 0.45 });
  }, [map, center]);
  return null;
}

export function PowerHeatMap({ buildings, powerByBuilding, buildingId = "all" }: { buildings: Building[]; powerByBuilding: Record<string, number>; buildingId?: string }) {
  const router = useRouter();
  const hottest = useMemo(() => Math.max(0, ...buildings.map((building) => powerByBuilding[building.id] ?? 0)), [buildings, powerByBuilding]);
  const ranked = useMemo(
    () => [...buildings].sort((left, right) => (powerByBuilding[right.id] ?? 0) - (powerByBuilding[left.id] ?? 0)),
    [buildings, powerByBuilding],
  );
  const focus = buildingId === "all" ? null : ranked.find((building) => building.id === buildingId) ?? null;
  const points = useMemo(
    () =>
      ranked.flatMap((building): L.HeatLatLngTuple[] => {
        if (!building.location) return [];
        if (focus && building.id !== focus.id) return [];
        const power = powerByBuilding[building.id] ?? 0;
        return [[building.location.lat, building.location.lng, hottest <= 0 ? 0 : power / hottest]];
      }),
    [ranked, powerByBuilding, hottest, focus],
  );
  const focusCenter = useMemo<[number, number] | null>(() => (focus?.location ? [focus.location.lat, focus.location.lng] : null), [focus]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <MapContainer center={AUA} zoom={17} scrollWheelZoom={false} className="campus-map z-0 h-[420px] overflow-hidden rounded-xl">
          <TileLayer attribution='&copy; <a href="https://yandex.com/maps">Yandex</a>' url={YANDEX_TILES} maxZoom={19} />
          <FocusView center={focusCenter} />
          <HeatField points={points} />
          {ranked.map((building) =>
            building.location ? (
              <Marker
                key={building.id}
                position={[building.location.lat, building.location.lng]}
                icon={labelIcon(building.name, formatPower(powerByBuilding[building.id] ?? 0))}
                eventHandlers={{ click: () => router.push(`/campus/${building.id}`) }}
              />
            ) : null,
          )}
        </MapContainer>
        <HeatLegend />
      </div>
      <BuildingHeatList buildings={buildings} powerByBuilding={powerByBuilding} activeId={focus?.id} legend={false} />
    </div>
  );
}
