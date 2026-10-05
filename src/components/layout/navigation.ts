import { BarChart3, Boxes, ClipboardList, FileClock, House, UserRound, Tags, UsersRound, type LucideIcon } from "lucide-react";

import type { Role } from "@/types/api";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: readonly Role[];
}

const everyRole = ["USER", "SUPPORT", "SUB_MANAGER", "ADMIN"] as const satisfies readonly Role[];
const staffRoles = ["SUPPORT", "SUB_MANAGER", "ADMIN"] as const satisfies readonly Role[];
const managerRoles = ["SUB_MANAGER", "ADMIN"] as const satisfies readonly Role[];
const adminRoles = ["ADMIN"] as const satisfies readonly Role[];

/** One role-derived source for desktop and mobile navigation. */
export const navigationItems: readonly NavigationItem[] = [
  { label: "Inicio", href: "/dashboard", icon: House, roles: everyRole },
  { label: "Mis tickets", href: "/tickets", icon: ClipboardList, roles: ["USER"] },
  { label: "Tickets", href: "/tickets", icon: ClipboardList, roles: staffRoles },
  { label: "Nuevo ticket", href: "/tickets/new", icon: ClipboardList, roles: ["USER"] },
  { label: "Bitácora", href: "/activity-log", icon: FileClock, roles: staffRoles },
  { label: "Inventario", href: "/inventory", icon: Boxes, roles: managerRoles },
  { label: "Reportes", href: "/reports", icon: BarChart3, roles: adminRoles },
  { label: "Categorías", href: "/admin/categories", icon: Tags, roles: adminRoles },
  { label: "Personal de soporte", href: "/admin/support-members", icon: UsersRound, roles: adminRoles },
  { label: "Mi perfil", href: "/profile", icon: UserRound, roles: everyRole },
];

export interface RouteAccess {
  path: string;
  roles: readonly Role[];
}

/** UX protection only. The API remains the authorization authority. */
export const routeAccess: readonly RouteAccess[] = [
  { path: "/dashboard", roles: everyRole },
  { path: "/tickets/new", roles: ["USER"] },
  { path: "/tickets", roles: everyRole },
  { path: "/activity-log", roles: staffRoles },
  { path: "/inventory", roles: managerRoles },
  { path: "/reports", roles: adminRoles },
  { path: "/admin/categories", roles: adminRoles },
  { path: "/admin/support-members", roles: adminRoles },
  { path: "/profile", roles: everyRole },
];

function matchesPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function getRouteAccess(pathname: string) {
  return [...routeAccess]
    .filter(({ path }) => matchesPath(pathname, path))
    .sort((left, right) => right.path.length - left.path.length)[0];
}

export function canAccess(role: Role, pathname: string) {
  return getRouteAccess(pathname)?.roles.includes(role) ?? false;
}

export function getNavigationItems(role: Role) {
  return navigationItems.filter(({ roles }) => roles.includes(role));
}

/** Picks the most-specific rendered link and respects path segment boundaries. */
export function getActiveNavigation(pathname: string, role: Role) {
  return getNavigationItems(role)
    .filter(({ href }) => matchesPath(pathname, href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;
}
