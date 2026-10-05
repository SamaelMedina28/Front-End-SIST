import { describe, expect, it } from "vitest";

import { canAccess, getActiveNavigation, getNavigationItems } from "../src/components/layout/navigation";
import type { Role } from "../src/types/api";

const matrix: Record<Role, { links: string[]; allowed: string[] }> = {
  USER: {
    links: ["/dashboard", "/tickets", "/tickets/new", "/profile"],
    allowed: ["/dashboard", "/tickets", "/tickets/new", "/profile"],
  },
  SUPPORT: {
    links: ["/dashboard", "/tickets", "/activity-log", "/profile"],
    allowed: ["/dashboard", "/tickets", "/activity-log", "/profile"],
  },
  SUB_MANAGER: {
    links: ["/dashboard", "/tickets", "/activity-log", "/inventory", "/profile"],
    allowed: ["/dashboard", "/tickets", "/activity-log", "/inventory", "/profile"],
  },
  ADMIN: {
    links: ["/dashboard", "/tickets", "/activity-log", "/inventory", "/reports", "/admin/categories", "/admin/support-members", "/profile"],
    allowed: ["/dashboard", "/tickets", "/activity-log", "/inventory", "/reports", "/admin/categories", "/admin/support-members", "/profile"],
  },
};

describe("role-based navigation and route access", () => {
  it.each(Object.entries(matrix) as [Role, (typeof matrix)[Role]][])("uses the OpenAPI role matrix for %s", (role, expected) => {
    expect(getNavigationItems(role).map(({ href }) => href)).toEqual(expected.links);
    for (const path of expected.allowed) expect(canAccess(role, path)).toBe(true);
    for (const path of ["/activity-log", "/inventory", "/reports", "/admin/categories", "/admin/support-members", "/tickets/new"]) {
      expect(canAccess(role, path)).toBe(expected.allowed.includes(path));
    }
    for (const path of ["/admin/categories/new", "/admin/support-members/new", "/admin/support-members/member-id", "/admin/support-members/member-id/edit"]) {
      expect(canAccess(role, path)).toBe(role === "ADMIN");
    }
  });

  it("uses segment-aware, most-specific active matching for nested paths", () => {
    expect(getActiveNavigation("/tickets/new", "USER")).toBe("/tickets/new");
    expect(getActiveNavigation("/tickets/new/confirm", "USER")).toBe("/tickets/new");
    expect(getActiveNavigation("/tickets/00000000-0000-4000-8000-000000000001", "SUPPORT")).toBe("/tickets");
    expect(getActiveNavigation("/admin/categories", "ADMIN")).toBe("/admin/categories");
    expect(getActiveNavigation("/ticketsomething", "SUPPORT")).toBeUndefined();
  });

  it("does not grant access to routes absent from the policy", () => {
    expect(canAccess("ADMIN", "/admin/unknown")).toBe(false);
  });

  it("restricts activity creation to SUB_MANAGER and keeps USER outside the module", () => {
    expect(canAccess("SUB_MANAGER", "/activity-log/new")).toBe(true);
    expect(canAccess("SUPPORT", "/activity-log/new")).toBe(false);
    expect(canAccess("ADMIN", "/activity-log/new")).toBe(false);
    expect(canAccess("USER", "/activity-log")).toBe(false);
    expect(canAccess("USER", "/activity-log/entry-id")).toBe(false);
  });
});
