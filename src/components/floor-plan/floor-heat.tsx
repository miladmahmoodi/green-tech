"use client";

import { paintHeatField, SCHEMATIC_RAMP, type HeatSpot } from "@/lib/heat";
import type { ZoneGeometry } from "@/types/energy";
import { useEffect, useRef } from "react";

export function FloorHeat({
  width,
  height,
  rooms,
  maxKw,
}: {
  width: number;
  height: number;
  rooms: { geometry: ZoneGeometry; powerKw: number }[];
  maxKw?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hottest = maxKw ?? Math.max(0, ...rooms.map((room) => room.powerKw));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    paintHeatField(
      ctx,
      width,
      height,
      rooms.map((room) => roomSpot(room.geometry, room.powerKw, hottest)),
      rooms.map((room) => room.geometry),
      SCHEMATIC_RAMP,
    );
  }, [width, height, rooms, hottest]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}

function roomSpot(box: ZoneGeometry, powerKw: number, hottest: number): HeatSpot {
  const ratio = hottest <= 0 ? 0 : powerKw / hottest;
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    radius: Math.max(box.width, box.height) * 0.62,
    intensity: 0.16 + ratio * 0.84,
  };
}
