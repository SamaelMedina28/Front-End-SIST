import { describe, expect, it } from "vitest";
import { blankSupportMember, normalizeSkills, supportMemberSchema, supportRoleOptions, toCreateSupportMember, toSupportMemberPatch } from "./support-member";

describe("support-member contract forms", () => {
  it("only allows the two support roles, validates email, and creates no password", () => {
    expect(supportRoleOptions).toEqual(["SUPPORT", "SUB_MANAGER"]);
    const values = { ...blankSupportMember, fullName: " Técnica Ejemplo ", email: " tecnica@example.edu ", institutionalId: " A-123 ", supportAreas: ["HARDWARE" as const], skills: ["Reparación"] };
    expect(supportMemberSchema.safeParse(values).success).toBe(true);
    expect(supportMemberSchema.safeParse({ ...values, email: "not-an-email" }).success).toBe(false);
    const body = toCreateSupportMember(values);
    expect(body).toEqual({ fullName: "Técnica Ejemplo", email: "tecnica@example.edu", institutionalId: "A-123", role: "SUPPORT", supportAreas: ["HARDWARE"], skills: ["Reparación"] });
    expect(body).not.toHaveProperty("password");
    expect(body).not.toHaveProperty("isActive");
  });
  it("deduplicates exact skill tags and emits only editable dirty PATCH keys", () => {
    expect(normalizeSkills([" Redes ", "Redes", "", "Cableado"])).toEqual(["Redes", "Cableado"]);
    const values = { ...blankSupportMember, fullName: "Nuevo nombre", email: "x@example.edu", institutionalId: "123", supportAreas: ["SOFTWARE" as const], skills: ["QA"], role: "SUB_MANAGER" as const, isActive: true };
    expect(toSupportMemberPatch(values, { fullName: true, role: true, supportAreas: true, email: true, institutionalId: true })).toEqual({ fullName: "Nuevo nombre", role: "SUB_MANAGER", supportAreas: ["SOFTWARE"] });
    expect(toSupportMemberPatch({ ...values, isActive: true }, { isActive: true })).toEqual({ isActive: true });
  });
});
