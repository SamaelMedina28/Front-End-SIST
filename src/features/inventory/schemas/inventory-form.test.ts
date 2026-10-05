import { describe, expect, it } from "vitest";
import { createInventoryRequest, dirtyInventoryPatch, emptyInventoryValues, inventoryFormSchema } from "./inventory-form";

describe("inventory form contract mapping", () => {
  it("requires the documented computer fields and always sends quantity one", () => {
    const values = { ...emptyInventoryValues("COMPUTER"), model: " Dell ", assetCode: " A-1 ", color: " Negro ", size: " SFF ", building: " Edificio 6 ", serialNumber: " DX-1 ", room: "", notes: "" };
    expect(inventoryFormSchema.safeParse(values).success).toBe(true);
    expect(createInventoryRequest(values)).toEqual({ type: "COMPUTER", model: "Dell", assetCode: "A-1", color: "Negro", size: "SFF", building: "Edificio 6", room: null, serialNumber: "DX-1", quantity: 1, notes: null });
  });

  it("does not carry fields from another type when changing the type", () => {
    const values = { ...emptyInventoryValues("CONTROL"), model: "Control remoto", quantity: "3", assetCode: "stale-from-computer" };
    expect(createInventoryRequest(values)).toEqual({ type: "CONTROL", model: "Control remoto", assetCode: "stale-from-computer", color: null, size: null, building: null, room: null, serialNumber: null, quantity: 3, notes: null });
  });

  it("validates quantity only for controls and adapters", () => {
    const invalid = { ...emptyInventoryValues("ADAPTER"), model: "USB-C", quantity: "0" };
    expect(inventoryFormSchema.safeParse(invalid).success).toBe(false);
    expect(inventoryFormSchema.safeParse({ ...emptyInventoryValues("PROJECTOR"), model: "X", assetCode: "P1", color: "Negro", size: "Mediano" }).success).toBe(true);
  });

  it("PATCHes only dirty allowed keys and never type or active state", () => {
    const values = { ...emptyInventoryValues("PROJECTOR"), model: "Nuevo", notes: "Ubicado" };
    expect(dirtyInventoryPatch(values, { model: true, notes: true, type: true })).toEqual({ model: "Nuevo", notes: "Ubicado" });
    expect(dirtyInventoryPatch(values, {})).toEqual({});
  });
});
