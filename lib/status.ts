import type { SecurityStatus } from "@/lib/types"

interface StatusStyle {
  label: string
  /** Pill background + text */
  pill: string
  /** Solid swatch for dots and stat accents */
  dot: string
  /** Text colour for large numbers */
  text: string
}

// Colours come from the next-platform palette: green / blue / gold / warm gray
export const STATUS_STYLES: Record<SecurityStatus, StatusStyle> = {
  "gate-out": {
    label: "Gate-Out",
    pill: "bg-gray-extralight text-gray-dark ring-gray-light/60 dark:bg-white/5 dark:text-gray-light dark:ring-white/10",
    dot: "bg-gray",
    text: "text-gray-dark dark:text-gray-light",
  },
  "gate-in": {
    label: "Gate-In",
    pill: "bg-green/12 text-green-dark ring-green/30 dark:bg-green/15 dark:text-green-light dark:ring-green/30",
    dot: "bg-green",
    text: "text-green-dark dark:text-green-light",
  },
  "reg-in": {
    label: "Registration-In",
    pill: "bg-blue/10 text-blue-dark ring-blue/25 dark:bg-blue/20 dark:text-blue-extralight dark:ring-blue/40",
    dot: "bg-blue",
    text: "text-blue dark:text-blue-light",
  },
  "reg-out": {
    label: "Registration-Out",
    pill: "bg-secondary-light/70 text-[#7a4a10] ring-secondary-extradark/30 dark:bg-secondary-extradark/15 dark:text-secondary dark:ring-secondary-extradark/30",
    dot: "bg-secondary-extradark",
    text: "text-secondary-extradark dark:text-secondary",
  },
}

export function getStatusStyle(status: SecurityStatus): StatusStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES["gate-out"]
}
