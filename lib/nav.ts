import {
  ClipboardCheck,
  DoorOpen,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react"

export interface NavLink {
  href: string
  label: string
  description: string
  icon: LucideIcon
  adminOnly?: boolean
  /** Desk tools are the ones volunteers use all day; they get top billing on the dashboard */
  desk?: boolean
}

export const NAV_LINKS: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overview of portal tools",
    icon: LayoutDashboard,
  },
  {
    href: "/gate-in",
    label: "Gate-In",
    description: "Check students in and out at the gate",
    icon: DoorOpen,
    desk: true,
  },
  {
    href: "/registration",
    label: "Registration Desk",
    description: "Handle registration desk check-in and check-out",
    icon: ClipboardCheck,
    desk: true,
  },
  {
    href: "/user-management",
    label: "Manage Users",
    description: "Edit student details or add walk-ins",
    icon: UserCog,
  },
  {
    href: "/fest-users",
    label: "Fest Users",
    description: "Create and remove portal login accounts",
    icon: UsersRound,
    adminOnly: true,
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Monitor gate-in, registration and status",
    icon: ShieldCheck,
  },
]

export function visibleNavLinks(role: string | undefined) {
  return NAV_LINKS.filter((link) => !link.adminOnly || role === "admin")
}
