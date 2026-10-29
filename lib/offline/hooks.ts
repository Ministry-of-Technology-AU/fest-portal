import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { User } from '@/lib/types'
import { effectiveUser, getServerState, getState, subscribe } from '@/lib/offline/engine'

export function useOfflineState() {
  return useSyncExternalStore(subscribe, getState, getServerState)
}

/** A student as this device currently sees them, updating as syncs land */
export function useStudent(id: string | null, fallback: User | null): User | null {
  const state = useOfflineState()
  return useMemo(() => (id ? effectiveUser(id, fallback) ?? null : null), [state, id, fallback])
}

/** Current time, re-read every `intervalMs`, for "synced 20s ago" labels */
export function useNow(intervalMs = 5_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
