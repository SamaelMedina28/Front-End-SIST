import { z } from "zod";
import type { SupportMember, CreateSupportMemberRequest, PatchSupportMemberRequest } from "../api";

export const supportRoleOptions = ["SUPPORT", "SUB_MANAGER"] as const satisfies readonly SupportMember["role"][];
export const supportAreaOptions = ["HARDWARE", "SOFTWARE", "NETWORKS", "ADMINISTRATIVE"] as const satisfies readonly SupportMember["supportAreas"][number][];
export type SupportArea = SupportMember["supportAreas"][number];
export const supportAreaNames: Record<SupportArea, string> = { HARDWARE: "Hardware", SOFTWARE: "Software", NETWORKS: "Redes", ADMINISTRATIVE: "Administrativo" };
export const supportRoleNames: Record<SupportMember["role"], string> = { SUPPORT: "Soporte", SUB_MANAGER: "Subencargado" };

export const supportMemberSchema = z.object({
  fullName: z.string().trim().min(1, "Ingresa el nombre completo."),
  email: z.string().trim().email("Ingresa un correo válido."),
  institutionalId: z.string().trim().min(1, "Ingresa la matrícula o número institucional."),
  role: z.enum(supportRoleOptions),
  supportAreas: z.array(z.enum(supportAreaOptions)),
  skills: z.array(z.string()),
  isActive: z.boolean(),
});
export type SupportMemberFormValues = z.infer<typeof supportMemberSchema>;
export const blankSupportMember: SupportMemberFormValues = { fullName: "", email: "", institutionalId: "", role: "SUPPORT", supportAreas: [], skills: [], isActive: true };
export function supportMemberFormValues(member?: SupportMember): SupportMemberFormValues {
  return member ? { fullName: member.fullName, email: member.email, institutionalId: member.institutionalId, role: member.role, supportAreas: member.supportAreas, skills: member.skills, isActive: member.isActive } : blankSupportMember;
}
export function normalizeSkills(skills: string[]) {
  const found = new Set<string>();
  return skills.map((skill) => skill.trim()).filter((skill) => { if (!skill || found.has(skill)) return false; found.add(skill); return true; });
}
export function toCreateSupportMember(values: SupportMemberFormValues): CreateSupportMemberRequest {
  return { fullName: values.fullName.trim(), email: values.email.trim(), institutionalId: values.institutionalId.trim(), role: values.role, supportAreas: values.supportAreas, skills: normalizeSkills(values.skills) };
}
export function toSupportMemberPatch(values: SupportMemberFormValues, dirty: Partial<Record<keyof SupportMemberFormValues, boolean>>): PatchSupportMemberRequest {
  const body: PatchSupportMemberRequest = {};
  if (dirty.fullName) body.fullName = values.fullName.trim();
  if (dirty.role) body.role = values.role;
  if (dirty.supportAreas) body.supportAreas = values.supportAreas;
  if (dirty.skills) body.skills = normalizeSkills(values.skills);
  if (dirty.isActive) body.isActive = values.isActive;
  return body;
}
