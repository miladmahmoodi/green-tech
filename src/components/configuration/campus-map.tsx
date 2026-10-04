"use client";

import type { Building, Campus, GeoPoint } from "@/types/energy";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AUA: [number, number] = [40.19272, 44.50339];

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

function MapClick({ enabled, onClick }: { enabled: boolean; onClick: (point: GeoPoint) => void }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
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
  placing,
  onMapClick,
  onCampusClick,
  onBuildingClick,
}: {
  campus: Campus;
  buildings: Building[];
  campusDraft: GeoPoint | null;
  placing: boolean;
  onMapClick: (point: GeoPoint) => void;
  onCampusClick: () => void;
  onBuildingClick: (building: Building) => void;
}) {
  const campusPoint = campusDraft ?? campus.location;
  const center = campusPoint ? ([campusPoint.lat, campusPoint.lng] as [number, number]) : AUA;
  return (
    <MapContainer center={center} zoom={17} scrollWheelZoom className="z-0 h-[520px] w-full rounded-xl" style={{ height: 520, width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitOnce />
      <MapClick enabled={placing} onClick={onMapClick} />
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
