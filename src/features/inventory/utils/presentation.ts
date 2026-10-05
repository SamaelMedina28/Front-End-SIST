import type { InventoryItem } from "../api";

export const inventoryTypes = ["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"] as const;
export type InventoryType = typeof inventoryTypes[number];
export const inventoryTypeLabels: Record<InventoryType, string> = { COMPUTER: "Computadora", PROJECTOR: "Proyector", CONTROL: "Control", ADAPTER: "Adaptador" };
export function inventoryName(item: Pick<InventoryItem, "model" | "type">) { return item.model?.trim() || inventoryTypeLabels[item.type]; }
export function inventoryLocation(item: Pick<InventoryItem, "building" | "room">) { return [item.building, item.room].filter(Boolean).join(" · ") || "Sin ubicación"; }
export function formatInventoryDate(value: string) { return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Tijuana" }).format(new Date(value)); }
