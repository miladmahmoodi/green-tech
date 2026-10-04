"use client";

import { Button } from "@/components/ui/button";
import type { Building, Campus, GeoPoint } from "@/types/energy";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AUA: [number, number] = [40.19272, 44.50339];

export const YANDEX_TILES = "https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=en_US&projection=web_mercator";

const campusIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#7c3aed;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const buildingIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#10b981;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const markIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#fff;border:3px solid #18181b;box-shadow:0 0 0 6px rgba(24,24,27,.18)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClick({ onClick }: { onClick: (point: GeoPoint) => void }) {
  useMapEvents({
    click(event) {
      onClick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function FitOnce() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  return null;
}

export function CampusMap({
  campus,
  buildings,
  campusDraft,
  mark,
  onMapClick,
  onCampusClick,
  onBuildingClick,
  onUseMark,
}: {
  campus: Campus;
  buildings: Building[];
  campusDraft: GeoPoint | null;
  mark: GeoPoint | null;
  onMapClick: (point: GeoPoint) => void;
  onCampusClick: () => void;
  onBuildingClick: (building: Building) => void;
  onUseMark: (kind: "campus" | "building", point: GeoPoint) => void;
}) {
  const campusPoint = campusDraft ?? campus.location;
  const center = campusPoint ? ([campusPoint.lat, campusPoint.lng] as [number, number]) : AUA;
  return (
    <MapContainer center={center} zoom={17} scrollWheelZoom className="campus-map z-0 h-[520px] w-full rounded-xl" style={{ height: 520, width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://yandex.com/maps/?lang=en_US">Yandex</a>' url={YANDEX_TILES} maxZoom={19} />
      <FitOnce />
      <MapClick onClick={onMapClick} />
      {mark ? (
        <Marker
          key={`${mark.lat}-${mark.lng}`}
          position={[mark.lat, mark.lng]}
          icon={markIcon}
          zIndexOffset={1000}
          eventHandlers={{
            add: (event) => event.target.openPopup(),
          }}
        >
          <Popup className="campus-mark-popup" closeButton={false} offset={[0, -4]}>
            <div className="w-52">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">Marked point</p>
              <p className="num mt-1 text-sm">{mark.lat.toFixed(5)}, {mark.lng.toFixed(5)}</p>
              <div className="mt-3 grid gap-1.5">
                <Button type="button" size="sm" className="w-full justify-start" onClick={() => onUseMark("campus", mark)}>
                  <span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden />
                  Set campus
                </Button>
                <Button type="button" size="sm" variant="outline" className="w-full justify-start" onClick={() => onUseMark("building", mark)}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  Add building
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ) : null}
      {campusPoint ? (
        <Marker
          position={[campusPoint.lat, campusPoint.lng]}
          icon={campusIcon}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event.originalEvent);
              onCampusClick();
            },
          }}
        />
      ) : null}
      {buildings.map((building) =>
        building.location ? (
          <Marker
            key={building.id}
            position={[building.location.lat, building.location.lng]}
            icon={buildingIcon}
            eventHandlers={{
              click: (event) => {
                L.DomEvent.stopPropagation(event.originalEvent);
                onBuildingClick(building);
              },
            }}
          />
        ) : null,
      )}
    </MapContainer>
  );
}
