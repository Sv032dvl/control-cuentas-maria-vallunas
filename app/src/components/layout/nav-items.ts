import {
  LayoutDashboard,
  ListChecks,
  Pizza,
  Settings2,
  Users,
  FileText,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const empleadoNav: NavItem[] = [
  { href: "/cierre", label: "Cierre", icon: ListChecks },
  { href: "/inventario", label: "Pizza", icon: Pizza },
];

export const adminNav: NavItem[] = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/cierres", label: "Cierres", icon: ListChecks },
  { href: "/dashboard/cuentas-digitales", label: "Digitales", icon: Smartphone },
  { href: "/dashboard/catalogos", label: "Catálogos", icon: Settings2 },
  { href: "/dashboard/facturas", label: "Facturas", icon: FileText },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
];

export function navFor(role: "admin" | "empleado") {
  return role === "admin" ? adminNav : empleadoNav;
}
