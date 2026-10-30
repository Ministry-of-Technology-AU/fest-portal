import type { SecurityStatus } from "@/lib/types"
import { getStatusStyle } from "@/lib/status"
import { cn } from "@/lib/utils"

export function StatusPill({ status, className }: { status: SecurityStatus; className?: string }) {
  const style = getStatusStyle(status)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        style.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  )
}
