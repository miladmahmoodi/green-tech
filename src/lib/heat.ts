import { interpolateYlOrRd } from "d3-scale-chromatic";

/** Yellow-orange-red ramp shared by the map, the building list, and floor-plan rooms. */
export function heatColor(value: number, max: number): string {
  return interpolateYlOrRd(heatRatio(value, max));
}

/** Dark ink on the hot end of the ramp, dark text on the pale end. */
export function heatInk(value: number, max: number): string {
  return heatRatio(value, max) > 0.55 ? "#ffffff" : "#18181b";
}

export function heatRatio(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, value / max));
}

/** Stops passed to leaflet.heat so the field matches `heatColor`. */
export const HEAT_GRADIENT: Record<number, string> = {
  0: interpolateYlOrRd(0),
  0.25: interpolateYlOrRd(0.25),
  0.5: interpolateYlOrRd(0.5),
  0.75: interpolateYlOrRd(0.75),
  1: interpolateYlOrRd(1),
};

export interface HeatSpot {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export interface HeatClip {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HEAT_RAMP: Array<[number, number, number]> = Array.from({ length: 256 }, (_, index) => parseRgb(interpolateYlOrRd(index / 255)));

/** Cyan wash through yellow and red, matching a building-schematic heatmap. */
export const SCHEMATIC_STOPS = ["#c8f4f1", "#5fd4df", "#f6e27a", "#f59a3c", "#ef4444", "#d61f3c"];

export const SCHEMATIC_RAMP: Array<[number, number, number]> = Array.from({ length: 256 }, (_, index) => {
  const scaled = (index / 255) * (SCHEMATIC_STOPS.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(SCHEMATIC_STOPS.length - 1, lower + 1);
  const mix = scaled - lower;
  const from = parseRgb(SCHEMATIC_STOPS[lower] ?? SCHEMATIC_STOPS[0]!);
  const to = parseRgb(SCHEMATIC_STOPS[upper] ?? SCHEMATIC_STOPS[0]!);
  return [
    Math.round(from[0] + (to[0] - from[0]) * mix),
    Math.round(from[1] + (to[1] - from[1]) * mix),
    Math.round(from[2] + (to[2] - from[2]) * mix),
  ];
});

function parseRgb(color: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex?.[1]) {
    const value = Number.parseInt(hex[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  const channels = color.match(/[\d.]+/g);
  if (!channels || channels.length < 3) return [255, 255, 204];
  return [Number(channels[0]), Number(channels[1]), Number(channels[2])];
}

/** Blurred yellow-orange-red field, the same ramp as the campus heat layer. */
export function paintHeatField(ctx: CanvasRenderingContext2D, width: number, height: number, spots: HeatSpot[], clips: HeatClip[] = [], ramp: Array<[number, number, number]> = HEAT_RAMP): void {
  ctx.clearRect(0, 0, width, height);
  if (spots.length === 0) return;

  const density = document.createElement("canvas");
  density.width = width;
  density.height = height;
  const densityCtx = density.getContext("2d");
  if (!densityCtx) return;

  for (const spot of spots) {
    const alpha = Math.min(1, Math.max(0, spot.intensity));
    if (alpha <= 0 || spot.radius <= 0) continue;
    const gradient = densityCtx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, spot.radius);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.45, `rgba(255,255,255,${alpha * 0.55})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    densityCtx.fillStyle = gradient;
    densityCtx.beginPath();
    densityCtx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
    densityCtx.fill();
  }

  const blurred = document.createElement("canvas");
  blurred.width = width;
  blurred.height = height;
  const blurredCtx = blurred.getContext("2d", { willReadFrequently: true });
  if (!blurredCtx) return;
  blurredCtx.filter = "blur(36px)";
  blurredCtx.drawImage(density, 0, 0);

  const pixels = blurredCtx.getImageData(0, 0, width, height);
  let peak = 1;
  for (let index = 3; index < pixels.data.length; index += 4) peak = Math.max(peak, pixels.data[index] ?? 0);

  const colored = ctx.createImageData(width, height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const ratio = (pixels.data[index + 3] ?? 0) / peak;
    if (ratio < 0.04) continue;
    const [red, green, blue] = ramp[Math.round(ratio * 255)] ?? ramp[0]!;
    colored.data[index] = red;
    colored.data[index + 1] = green;
    colored.data[index + 2] = blue;
    const schematic = ramp === SCHEMATIC_RAMP;
    colored.data[index + 3] = Math.round((schematic ? Math.min(0.72, 0.28 + ratio * 0.5) : Math.min(0.55, 0.16 + ratio * 0.4)) * 255);
  }
  ctx.putImageData(colored, 0, 0);
  if (clips.length === 0) return;

  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const maskCtx = mask.getContext("2d");
  if (!maskCtx) return;
  maskCtx.filter = "blur(16px)";
  maskCtx.fillStyle = "#fff";
  for (const clip of clips) maskCtx.fillRect(clip.x, clip.y, clip.width, clip.height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}
