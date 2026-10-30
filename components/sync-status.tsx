"use client"

import Link from "next/link"
import { AlertTriangle, CloudOff, Loader2, RefreshCw, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { dismissChange, retryChange, syncNow } from "@/lib/offline/engine"
import { useNow, useOfflineState } from "@/lib/offline/hooks"
import { TRANSITIONS } from "@/lib/transitions"
import { cn } from "@/lib/utils"

// Data older than this is called out as not fresh, even while online
const STALE_AFTER_MS = 30_000

function ago(iso: string | null, now: number) {
  if (!iso) return "never synced on this device"
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000))
  if (seconds < 10) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.round(minutes / 60)} h ago`
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

/** How fresh the on-device data is, plus any scans still waiting to reach the server */
export function SyncStatus() {
  const state = useOfflineState()
  const now = useNow()

  if (!state.ownerId || !state.ready) return null

  const pending = state.queue.filter((op) => op.state === "pending").length
  const rejected = state.queue.filter((op) => op.state === "rejected")
  const syncedAgo = ago(state.syncedAt, now)
  const stale = !state.syncedAt || now - Date.parse(state.syncedAt) > STALE_AFTER_MS

  let tone: "muted" | "warn" | "error" = "muted"
  let icon = <span className="size-2 rounded-full bg-green" aria-hidden />
  let message = `Live · synced ${syncedAgo}`

  if (state.authExpired) {
    tone = "error"
    icon = <AlertTriangle className="size-4 shrink-0" />
    message = pending
      ? `Signed out. ${plural(pending, "scan")} saved on this device will be sent after you sign in again.`
      : "Signed out. Sign in again to keep syncing."
  } else if (!state.reachable) {
    tone = "warn"
    icon = <CloudOff className="size-4 shrink-0" />
    message = `Offline · showing data from ${syncedAgo}, may not be current.${
      pending ? ` ${plural(pending, "scan")} saved here, sending automatically.` : " Scans are saved here and sent automatically."
    }`
  } else if (pending) {
    icon = <Loader2 className="size-4 shrink-0 animate-spin" />
    message = `Sending ${plural(pending, "scan")}…`
  } else if (stale) {
    tone = "warn"
    icon = <RefreshCw className="size-4 shrink-0 animate-spin" />
    message = `Resyncing · data is from ${syncedAgo}, may not be current`
  }

  return (
    <div className="mb-4 space-y-2" role="status" aria-live="polite">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm",
          tone === "muted" && "text-muted-foreground",
          tone === "warn" && "bg-secondary-light/70 text-[#7a4a10] dark:bg-secondary-extradark/15 dark:text-secondary-light",
          tone === "error" && "bg-destructive/10 text-destructive",
        )}
      >
        {icon}
        <span className="min-w-0 flex-1">{message}</span>
        {state.authExpired ? (
          <Button asChild size="sm" variant="destructive">
            <Link href="/login">Sign in</Link>
          </Button>
        ) : (
          tone !== "muted" && (
            <Button size="sm" variant="ghost" onClick={syncNow} className="h-7 px-2">
              Retry now
            </Button>
          )
        )}
      </div>

      {rejected.map((op) => (
        <div
          key={op.opId}
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-destructive">
              {TRANSITIONS[op.action].label} for {op.userName} <span className="font-mono">({op.userId})</span> was rejected
            </p>
            <p className="text-destructive/90">
              {op.error} · scanned {new Date(op.scannedAt).toLocaleTimeString()}
            </p>
          </div>
          <Button size="icon-sm" variant="ghost" onClick={() => retryChange(op.opId)} aria-label="Send again">
            <RotateCcw />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => dismissChange(op.opId)} aria-label="Dismiss">
            <X />
          </Button>
        </div>
      ))}
    </div>
  )
}
