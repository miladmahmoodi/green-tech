export function formatPower(kw: number, digits = true): string {
  const sign = kw < 0 ? "-" : "";
  const abs = Math.abs(kw);
  if (abs >= 100) return `${sign}${abs.toFixed(0)} kW`;
  if (abs >= 10) return `${sign}${trimNumber(abs, digits ? 1 : 0)} kW`;
  if (abs >= 1) return `${sign}${trimNumber(abs, 1)} kW`;
  return `${sign}${Math.round(abs * 1000)} W`;
}

function trimNumber(value: number, digits: number): string {
  const fixed = value.toFixed(digits);
  return digits === 0 ? fixed : fixed.replace(/\.0$/, "");
}

export function formatEnergy(kwh: number): string {
  return `${Math.round(kwh).toLocaleString("en-US")} kWh`;
}

export function formatMoney(usd: number): string {
  const sign = usd < 0 ? "-" : "";
  return `${sign}$${Math.abs(usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatAgo(iso: string, nowIso: string): string {
  const seconds = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Yerevan",
  }).format(new Date(iso));
}

let deviceTypeCatalog: Record<string, string> = {};

export function setDeviceTypeCatalog(records: { id: string; label: string }[]): void {
  deviceTypeCatalog = Object.fromEntries(records.map((record) => [record.id, record.label]));
}

export function deviceTypeLabel(type: string): string {
  if (deviceTypeCatalog[type]) return deviceTypeCatalog[type];
  const labels: Record<string, string> = {
    electricity_meter: "Meter",
    lighting: "Lighting",
    hvac: "HVAC",
    heating: "Heating",
    cooling: "Cooling",
    computer: "Computer",
    smart_plug: "Smart Plug",
    water_heater: "Water Heater",
    elevator: "Elevator",
    solar_panel: "Solar",
    solar_inverter: "Inverter",
    battery: "Battery",
  };
  return labels[type] ?? type;
}
