import type React from "react"
import { CalendarDays, Mail, Phone, School, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/status-pill"
import type { User } from "@/lib/types"

interface StudentSummaryProps {
  user: User
  onClear?: () => void
  /** Extra fields rendered between the details and the action bar */
  children?: React.ReactNode
  actions: React.ReactNode
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold break-words">{value || "—"}</p>
      </div>
    </div>
  )
}

function ChipGroup({ icon: Icon, label, items, chipClass }: { icon: React.ElementType; label: string; items: string[]; chipClass: string }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
        <span className="font-mono font-normal normal-case">({items.length})</span>
      </p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => (
            <span key={index} className={`rounded-md px-2 py-1 text-xs font-semibold ${chipClass}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">None</p>
      )}
    </div>
  )
}

export function StudentSummary({ user, onClear, children, actions }: StudentSummaryProps) {
  return (
    <section className="animate-rise overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
      {/* Identity strip */}
      <div className="flex items-start justify-between gap-3 border-b bg-primary/[0.04] px-4 py-4 sm:px-6 dark:bg-primary/10">
        <div className="min-w-0">
          <h2 className="text-xl leading-tight font-extrabold break-words sm:text-2xl">{user.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-foreground/5 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider dark:bg-white/10">
              {user.id}
            </span>
            <StatusPill status={user.currentStatus} />
            <span className="text-xs text-muted-foreground">
              since {new Date(user.lastStatusTime).toLocaleString()}
            </span>
          </div>
        </div>
        {onClear && (
          <Button variant="ghost" size="icon-sm" onClick={onClear} aria-label="Clear selection" className="-mt-1 -mr-2 shrink-0">
            <X />
          </Button>
        )}
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail icon={School} label="College" value={user.collegeName} />
          <Detail icon={Phone} label="Phone" value={user.phoneNumber} />
          <div className="sm:col-span-2">
            <Detail icon={Mail} label="Email" value={user.email} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t pt-5 sm:grid-cols-2">
          <ChipGroup
            icon={Sparkles}
            label="Events"
            items={user.eventsRegistered}
            chipClass="bg-primary/10 text-primary dark:bg-primary/25 dark:text-primary-extralight"
          />
          <ChipGroup
            icon={CalendarDays}
            label="Visit dates"
            items={user.visitDates}
            chipClass="bg-blue/10 text-blue-dark dark:bg-blue/20 dark:text-blue-extralight"
          />
        </div>

        {children}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t bg-muted/50 px-4 py-4 sm:px-6">{actions}</div>
    </section>
  )
}
