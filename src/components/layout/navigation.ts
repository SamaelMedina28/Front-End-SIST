import { BarChart3, Boxes, ClipboardList, FileClock, House, Tags, UsersRound, type LucideIcon } from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { label: "Inicio", href: "/design-system", icon: House },
  { label: "Tickets", href: "#tickets", icon: ClipboardList },
  { label: "Bitácora", href: "#bitacora", icon: FileClock },
  { label: "Inventario", href: "#inventario", icon: Boxes },
  { label: "Reportes", href: "#reportes", icon: BarChart3 },
  { label: "Categorías", href: "#categorias", icon: Tags },
  { label: "Personal de soporte", href: "#soporte", icon: UsersRound },
];
