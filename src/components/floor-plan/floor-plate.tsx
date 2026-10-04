import type { FloorPlanZone } from "@/types/energy";

const INK = "#3d6d86";

export function FloorPlate({ width, height, zones, marks = false }: { width: number; height: number; zones: FloorPlanZone[]; marks?: boolean }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={marks ? "pointer-events-none absolute inset-0 h-full w-full" : "block h-auto w-full"} aria-hidden>
      {marks ? null : <rect width={width} height={height} fill="#f4fbfb" />}
      {zones.map((zone) => (
        <g key={zone.id}>
          {marks ? (
            <>
              <rect x={zone.geometry.x} y={zone.geometry.y} width={zone.geometry.width} height={zone.geometry.height} fill="none" stroke={INK} strokeWidth="1.6" />
              <Furniture kind={roomKind(zone.type, zone.name)} box={zone.geometry} />
            </>
          ) : (
            <rect x={zone.geometry.x} y={zone.geometry.y} width={zone.geometry.width} height={zone.geometry.height} fill="#ffffff" />
          )}
        </g>
      ))}
    </svg>
  );
}

function roomKind(type: string, name: string): string {
  const label = `${type} ${name}`.toLowerCase();
  if (label.includes("gallery")) return "gallery";
  if (label.includes("library") || label.includes("reading")) return "library";
  if (label.includes("lab")) return "lab";
  if (label.includes("class") || label.includes("seminar") || label.includes("lecture") || label.includes("hall")) return "classroom";
  if (label.includes("office") || label.includes("admin") || label.includes("faculty")) return "office";
  if (label.includes("elev")) return "elevator";
  if (label.includes("plant")) return "plant";
  return "lobby";
}

function Furniture({ kind, box }: { kind: string; box: { x: number; y: number; width: number; height: number } }) {
  const pad = 14;
  const left = box.x + pad;
  const top = box.y + pad;
  const width = Math.max(0, box.width - pad * 2);
  const height = Math.max(0, box.height - pad * 2);
  if (kind === "library") {
    return (
      <g fill="none" stroke={INK} strokeWidth="1.2">
        {Array.from({ length: 4 }, (_, index) => (
          <rect key={index} x={left + index * (width / 4) + 4} y={top} width={width / 4 - 12} height={height * 0.28} />
        ))}
        <rect x={left + width * 0.3} y={top + height * 0.48} width={width * 0.16} height={12} />
        <rect x={left + width * 0.54} y={top + height * 0.48} width={width * 0.16} height={12} />
      </g>
    );
  }
  if (kind === "gallery") {
    return (
      <g fill="none" stroke={INK} strokeWidth="1.2">
        {[28, 22, 34].map((frame, index) => (
          <rect key={index} x={left + 8 + index * (width / 3)} y={top} width={frame} height={frame * 0.7} />
        ))}
      </g>
    );
  }
  if (kind === "classroom" || kind === "lab") {
    return (
      <g fill="none" stroke={INK} strokeWidth="1.1">
        {Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 4 }, (_, column) => <rect key={`${row}-${column}`} x={left + column * (width / 4) + 4} y={top + 8 + row * (height / 3.2)} width={width / 4 - 12} height={8} />),
        )}
      </g>
    );
  }
  if (kind === "office") {
    return (
      <g fill="none" stroke={INK} strokeWidth="1.2">
        <rect x={left + width * 0.15} y={top + height * 0.3} width={width * 0.35} height={height * 0.22} />
        <circle cx={left + width * 0.32} cy={top + height * 0.62} r={6} />
      </g>
    );
  }
  if (kind === "elevator") {
    return (
      <g fill="none" stroke={INK} strokeWidth="1.2">
        <line x1={box.x + box.width / 2} y1={box.y + 8} x2={box.x + box.width / 2} y2={box.y + box.height - 8} />
      </g>
    );
  }
  if (kind === "plant") {
    return (
      <g fill="none" stroke={INK} strokeWidth="1.2">
        <rect x={left} y={top} width={width * 0.35} height={height * 0.4} />
        <circle cx={left + width * 0.7} cy={top + height * 0.55} r={10} />
      </g>
    );
  }
  return (
    <g fill="none" stroke={INK} strokeWidth="1.2">
      <circle cx={box.x + box.width / 2} cy={box.y + box.height / 2} r={Math.min(width, height) * 0.12} />
    </g>
  );
}
