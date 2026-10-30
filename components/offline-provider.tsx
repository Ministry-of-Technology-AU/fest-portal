"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session } from "next-auth"
import { signOut, useSession } from "next-auth/react"
import { clearOfflineData, start } from "@/lib/offline/engine"
import { visibleNavLinks } from "@/lib/nav"

// next-auth treats a failed session check as "signed out", so on a bad
// connection the desks would lose the operator (and the band fields) every
// time its 5-minute check failed. This keeps the last confirmed session on the
// device and only drops it when the server actually says the session is gone.

const SESSION_KEY = "fest-portal:session"

type OperatorStatus = "loading" | "authenticated" | "unauthenticated"

interface OperatorContextValue {
  session: Session | null
  status: OperatorStatus
}

const OperatorContext = createContext<OperatorContextValue>({ session: null, status: "loading" })

function readCachedSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeCachedSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage blocked; the session just won't survive going offline
  }
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { data, status } = useSession()
  const [cached, setCached] = useState<Session | null>(null)
  // Result of asking the server directly after next-auth reported no session
  const [check, setCheck] = useState<"idle" | "unreachable" | "signed-out">("idle")

  useEffect(() => {
    setCached(readCachedSession())
  }, [])

  useEffect(() => {
    if (status === "authenticated" && data) {
      writeCachedSession(data)
      setCached(data)
      setCheck("idle")
      return
    }
    if (status !== "unauthenticated") return

    let cancelled = false
    fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(5_000) })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`${response.status}`))))
      .then((session: Session | null) => {
        if (cancelled) return
        if (session?.user) {
          writeCachedSession(session)
          setCached(session)
          setCheck("idle")
        } else {
          writeCachedSession(null)
          setCached(null)
          setCheck("signed-out")
        }
      })
      .catch(() => {
        if (!cancelled) setCheck("unreachable")
      })
    return () => {
      cancelled = true
    }
  }, [status, data])

  const value = useMemo<OperatorContextValue>(() => {
    if (status === "authenticated" && data) return { session: data, status: "authenticated" }
    if (check === "signed-out") return { session: null, status: "unauthenticated" }
    if (cached) return { session: cached, status: "authenticated" }
    if (status === "loading" || check === "idle") return { session: null, status: "loading" }
    return { session: null, status: "unauthenticated" }
  }, [status, data, cached, check])

  const ownerId = value.session?.user?.id
  const role = value.session?.user?.role

  useEffect(() => {
    if (ownerId) start(ownerId)
  }, [ownerId, status])

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("Service worker registration failed:", error))
  }, [])

  // Once signed in, have the service worker save this account's pages so they open offline
  useEffect(() => {
    if (!ownerId || status !== "authenticated" || !("serviceWorker" in navigator)) return
    const urls = visibleNavLinks(role).map((link) => link.href)
    navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage({ type: "warm", urls }))
      .catch(() => {})
  }, [ownerId, role, status])

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>
}

/** The signed-in operator, kept through dropped connections. Use instead of useSession. */
export function useOperator() {
  return useContext(OperatorContext)
}

/** Signs out and deletes the roster and any unsent changes from this device */
export async function signOutAndClear() {
  writeCachedSession(null)
  await clearOfflineData()
  await signOut({ callbackUrl: "/login" })
}
