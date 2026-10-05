import { z } from "zod";
import type { CreateInventoryRequest, InventoryItem, PatchInventoryRequest } from "../api";
import type { InventoryType } from "../utils/presentation";

export const inventoryFormSchema = z.object({
  type: z.enum(["COMPUTER", "PROJECTOR", "CONTROL", "ADAPTER"]),
  model: z.string(), assetCode: z.string(), color: z.string(), size: z.string(), building: z.string(), room: z.string(), serialNumber: z.string(), quantity: z.string(), notes: z.string(),
}).superRefine((v, ctx) => {
  const required: (keyof typeof v)[] = ["model"];
  if (v.type === "COMPUTER") required.push("assetCode", "color", "size", "building", "serialNumber");
  if (v.type === "PROJECTOR") required.push("assetCode", "color", "size");
  for (const key of required) if (!v[key].trim()) ctx.addIssue({ code: "custom", path: [key], message: "Este campo es obligatorio." });
  if (v.type === "CONTROL" || v.type === "ADAPTER") {
    const count = Number(v.quantity);
    if (!Number.isInteger(count) || count < 1) ctx.addIssue({ code: "custom", path: ["quantity"], message: "Ingresa una cantidad entera de al menos 1." });
  }
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
export const emptyInventoryValues = (type: InventoryType = "COMPUTER"): InventoryFormValues => ({ type, model: "", assetCode: "", color: "", size: "", building: "", room: "", serialNumber: "", quantity: "1", notes: "" });
export function inventoryValues(item: InventoryItem): InventoryFormValues {
  return { type: item.type, model: item.model ?? "", assetCode: item.assetCode ?? "", color: item.color ?? "", size: item.size ?? "", building: item.building ?? "", room: item.room ?? "", serialNumber: item.serialNumber ?? "", quantity: String(item.quantity), notes: item.notes ?? "" };
}

function optional(value: string) { return value.trim() || null; }
export function createInventoryRequest(v: InventoryFormValues): CreateInventoryRequest {
  const common = { type: v.type, model: v.model.trim(), quantity: v.type === "COMPUTER" || v.type === "PROJECTOR" ? 1 as const : Number(v.quantity), notes: optional(v.notes) };
  if (v.type === "COMPUTER") return { ...common, type: "COMPUTER", assetCode: v.assetCode.trim(), color: v.color.trim(), size: v.size.trim(), building: v.building.trim(), room: optional(v.room), serialNumber: v.serialNumber.trim(), quantity: 1 };
  if (v.type === "PROJECTOR") return { ...common, type: "PROJECTOR", assetCode: v.assetCode.trim(), color: v.color.trim(), size: v.size.trim(), building: optional(v.building), room: optional(v.room), serialNumber: optional(v.serialNumber), quantity: 1 };
  if (v.type === "CONTROL") return { ...common, type: "CONTROL", assetCode: optional(v.assetCode), color: optional(v.color), size: optional(v.size), building: optional(v.building), room: optional(v.room), serialNumber: optional(v.serialNumber), quantity: Number(v.quantity) };
  return { ...common, type: "ADAPTER", assetCode: optional(v.assetCode), color: optional(v.color), size: optional(v.size), building: optional(v.building), room: optional(v.room), serialNumber: optional(v.serialNumber), quantity: Number(v.quantity) };
}

const editableFields = ["model", "assetCode", "color", "size", "building", "room", "serialNumber", "quantity", "notes"] as const;
export function dirtyInventoryPatch(values: InventoryFormValues, dirty: Partial<Record<keyof InventoryFormValues, boolean>>): PatchInventoryRequest {
  const body: PatchInventoryRequest = {};
  for (const key of editableFields) {
    if (!dirty[key]) continue;
    if (key === "quantity") body.quantity = Number(values.quantity);
    else if (key === "model") body.model = values.model.trim();
    else body[key] = optional(values[key]);
  }
  return body;
}
