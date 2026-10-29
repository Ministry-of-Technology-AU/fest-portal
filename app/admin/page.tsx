"use client"

import React, { useEffect, useState } from "react"
import { AlertCircle, ChevronRight, Loader2, RefreshCw, Search, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusPill } from "@/components/status-pill"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import type { User, SecurityStatus } from "@/lib/types"
import { getStatusStyle } from "@/lib/status"
import { useUsers } from "@/lib/api"
import { cn } from "@/lib/utils"

function UserTable({ users }: { users: User[] }) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        No students in this status
      </div>
    )
  }

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0 sm:rounded-lg sm:border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y bg-muted/70 text-left text-xs tracking-wider text-muted-foreground uppercase sm:border-t-0">
            <th className="px-4 py-3 font-bold">Name</th>
            <th className="px-4 py-3 font-bold">ID</th>
            <th className="hidden px-4 py-3 font-bold md:table-cell">College</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="hidden px-4 py-3 font-bold lg:table-cell">Last Updated</th>
            <th className="hidden px-4 py-3 font-bold sm:table-cell">Events</th>
            <th className="px-4 py-3 text-right font-bold">Trail</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const expanded = expandedUser === user.id
            return (
              <React.Fragment key={user.id}>
                <tr className={cn("border-b transition-colors hover:bg-accent/60", expanded && "bg-accent/60")}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{user.collegeName}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{user.collegeName}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={user.currentStatus} />
                  </td>
                  <td className="hidden px-4 py-3 text-xs whitespace-nowrap text-muted-foreground lg:table-cell">
                    {new Date(user.lastStatusTime).toLocaleString()}
                  </td>
                  <td className="hidden px-4 py-3 text-xs sm:table-cell">{user.eventsRegistered.length} events</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedUser(expanded ? null : user.id)}
                      aria-expanded={expanded}
                      className="text-xs whitespace-nowrap"
                    >
                      {user.statusTrail.length}
                      <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
                    </Button>
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-b bg-muted/40">
                    <td colSpan={7} className="px-4 py-4">
                      <h4 className="mb-2 text-sm font-bold">Status trail for {user.name}</h4>
                      <ol className="max-h-48 space-y-1.5 overflow-y-auto">
                        {user.statusTrail.slice().reverse().map((entry, index) => (
                          <li
                            key={`${user.id}-trail-${index}`}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-card px-3 py-2 text-xs"
                          >
                            <StatusPill status={entry.status} />
                            <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                            <span className="text-muted-foreground capitalize">via {entry.source}</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const STAT_CARDS: { status: SecurityStatus; title: string }[] = [
  { status: "gate-in", title: "Inside gate, not registered" },
  { status: "reg-in", title: "Inside gate and registered" },
  { status: "reg-out", title: "Registered out, still inside" },
  { status: "gate-out", title: "Outside gate" },
]

const TAB_COPY: Record<SecurityStatus, { tab: string; heading: string; description: string }> = {
  "gate-out": {
    tab: "Outside Gate",
    heading: "Students Outside Gate",
    description: "Students who are currently outside the campus gates",
  },
  "gate-in": {
    tab: "Inside Gate",
    heading: "Students Inside Gate",
    description: "Students who have entered the campus but haven't registered yet",
  },
  "reg-in": {
    tab: "Registered In",
    heading: "Currently Registered Students",
    description: "Students who are registered in and participating in events",
  },
  "reg-out": {
    tab: "Registered Out",
    heading: "Registration Complete",
    description: "Students who have registered but haven't left the gate",
  },
}

const TAB_ORDER: SecurityStatus[] = ["gate-out", "gate-in", "reg-in", "reg-out"]

export default function AdminPage() {
  const { users, loading, error, refetch, syncChanges } = useUsers()
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [bandQuery, setBandQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>("gate-out")

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  // Auto-refresh: fetch only status changes every 15 seconds, and do a full
  // reload every 5 minutes to pick up profile edits. Paused while the tab is
  // hidden; catches up as soon as it's visible again.
  useEffect(() => {
    let ticks = 0

    const tick = async () => {
      if (document.visibilityState !== "visible") return
      ticks += 1
      if (ticks % 20 === 0) await refetch()
      else await syncChanges()
      setLastUpdated(new Date())
    }

    const interval = setInterval(tick, 15_000)
    document.addEventListener("visibilitychange", tick)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", tick)
    }
  }, [refetch, syncChanges])

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-4">Loading admin dashboard...</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
          <AlertCircle className="mb-3 size-10 text-destructive" />
          <p className="text-lg font-bold">Error Loading Dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button onClick={refetch} className="mt-6">
            Retry
          </Button>
        </div>
      </AppShell>
    )
  }

  const day11GateIns = users.filter((u) =>
    u.statusTrail.some((t) => t.status === "gate-in" && new Date(t.timestamp).toLocaleDateString("en-GB") === "11/04/2026")
  ).length

  const day12GateIns = users.filter((u) =>
    u.statusTrail.some((t) => t.status === "gate-in" && new Date(t.timestamp).toLocaleDateString("en-GB") === "12/04/2026")
  ).length

  const bandUsers = bandQuery.trim()
    ? users.filter((u) => {
        const band = (u.additionalParams?.bandNumber as string) ?? ""
        return band.toLowerCase() === bandQuery.trim().toLowerCase()
      })
    : []

  // Filter users by status
  const usersByStatus: Record<SecurityStatus, User[]> = {
    "gate-out": users.filter((u) => u.currentStatus === "gate-out"),
    "gate-in": users.filter((u) => u.currentStatus === "gate-in"),
    "reg-in": users.filter((u) => u.currentStatus === "reg-in"),
    "reg-out": users.filter((u) => u.currentStatus === "reg-out"),
  }

  return (
    <AppShell>
      <PageHeader
        icon={ShieldCheck}
        eyebrow="Admin"
        title="Admin Dashboard"
        description="Monitor all portal activity and student status."
        actions={
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={cn(refreshing && "animate-spin")} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {/* Live strip */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-green" />
          </span>
          Live data from database
        </span>
        <span>
          Total: <strong className="text-foreground">{users.length}</strong> students
        </span>
        <span>Last updated {lastUpdated.toLocaleTimeString()}</span>
        <span className="inline-flex gap-3">
          <span>
            11 Apr gate-ins: <strong className="text-secondary-extradark">{day11GateIns}</strong>
          </span>
          <span>
            12 Apr gate-ins: <strong className="text-secondary-extradark">{day12GateIns}</strong>
          </span>
        </span>
      </div>

      {/* Stat cards double as tab shortcuts */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ status, title }, index) => {
          const style = getStatusStyle(status)
          const active = activeTab === status
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveTab(status)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "group relative animate-rise overflow-hidden rounded-xl border bg-card p-4 text-left shadow-[0_1px_2px_rgba(60,20,10,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5",
                active && "border-primary/50 ring-2 ring-primary/20",
              )}
            >
              <span className={cn("absolute inset-x-0 top-0 h-1", style.dot)} aria-hidden />
              <p className="text-xs leading-snug font-semibold text-muted-foreground sm:text-sm">{title}</p>
              <p className={cn("mt-2 font-heading text-3xl font-extrabold tabular-nums sm:text-4xl", style.text)}>
                {usersByStatus[status].length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{style.label}</p>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Status Overview</CardTitle>
          <CardDescription>View detailed status of all students</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
              <TabsList className="w-max min-w-full justify-start">
                {TAB_ORDER.map((status) => (
                  <TabsTrigger key={status} value={status} className="flex-none sm:flex-1">
                    {TAB_COPY[status].tab}
                    <span className="rounded-full bg-black/5 px-1.5 text-[11px] tabular-nums dark:bg-white/10">
                      {usersByStatus[status].length}
                    </span>
                  </TabsTrigger>
                ))}
                <TabsTrigger value="band-search" className="flex-none sm:flex-1">
                  <Search />
                  Band Search
                </TabsTrigger>
              </TabsList>
            </div>

            {TAB_ORDER.map((status) => (
              <TabsContent key={status} value={status} className="mt-4">
                <div className="mb-4">
                  <h3 className={cn("text-lg font-bold", getStatusStyle(status).text)}>{TAB_COPY[status].heading}</h3>
                  <p className="text-sm text-muted-foreground">{TAB_COPY[status].description}</p>
                </div>
                <UserTable users={usersByStatus[status]} />
              </TabsContent>
            ))}

            <TabsContent value="band-search" className="mt-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold">Band Search</h3>
                <p className="text-sm text-muted-foreground">Find all participants assigned to a specific band number</p>
              </div>
              <div className="relative mb-4 max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Band number, e.g. B3"
                  value={bandQuery}
                  onChange={(e) => setBandQuery(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
              {bandQuery.trim() && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {bandUsers.length} participant{bandUsers.length !== 1 ? "s" : ""} found for band{" "}
                  <strong className="text-foreground">{bandQuery.trim()}</strong>
                </p>
              )}
              {bandQuery.trim() && <UserTable users={bandUsers} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppShell>
  )
}
