"use client"

import React, { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import type { User, SecurityStatus } from "@/lib/types"
import { useUsers } from "@/lib/api"

export default function AdminPage() {
  const { users, loading, error, refetch } = useUsers()
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [bandQuery, setBandQuery] = useState("")

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  // Auto-refresh every 30 seconds
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (!refreshing) {
  //       await refetch()
  //       setLastUpdated(new Date())
  //     }
  //   }, 30000) // 30 seconds

  //   return () => clearInterval(interval)
  // }, [refreshing, refetch])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">Error Loading Dashboard</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <button 
              onClick={refetch}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  const bandUsers = bandQuery.trim()
    ? users.filter((u) => {
        const band = (u.additionalParams?.bandNumber as string) ?? ""
        return band.toLowerCase() === bandQuery.trim().toLowerCase()
      })
    : []

  // Filter users by status
  const gateOutUsers = users.filter((u) => u.currentStatus === "gate-out")
  const gateInUsers = users.filter((u) => u.currentStatus === "gate-in")
  const regInUsers = users.filter((u) => u.currentStatus === "reg-in")
  const regOutUsers = users.filter((u) => u.currentStatus === "reg-out")

  const getStatusDisplay = (status: SecurityStatus) => {
    const statusConfig = {
      "gate-out": { label: "Gate-Out", color: "text-gray-600", bgColor: "bg-gray-100 text-gray-600" },
      "gate-in": { label: "Gate-In", color: "text-green-600", bgColor: "bg-green-100 text-green-600" },
      "reg-in": { label: "Registration-In", color: "text-blue-600", bgColor: "bg-blue-100 text-blue-600" },
      "reg-out": { label: "Registration-Out", color: "text-purple-600", bgColor: "bg-purple-100 text-purple-600" },
    }
    return statusConfig[status]
  }

  const UserTable = ({ users }: { users: User[] }) => {
    const [expandedUser, setExpandedUser] = useState<string | null>(null)

    if (users.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No students in this status</p>
        </div>
      )
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted">
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">ID</th>
              <th className="text-left p-3 font-semibold">College</th>
              <th className="text-left p-3 font-semibold">Current Status</th>
              <th className="text-left p-3 font-semibold">Last Updated</th>
              <th className="text-left p-3 font-semibold">Events</th>
              <th className="text-left p-3 font-semibold">Trail</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3 font-mono">{user.id}</td>
                  <td className="p-3 text-sm">{user.collegeName}</td>
                  <td className="p-3">
                    <span className={`font-medium ${getStatusDisplay(user.currentStatus).color}`}>
                      {getStatusDisplay(user.currentStatus).label}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {new Date(user.lastStatusTime).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs">
                    {user.eventsRegistered.length} events
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      className="text-xs bg-secondary hover:bg-secondary/80 px-2 py-1 rounded text-secondary-foreground"
                    >
                      {user.statusTrail.length} entries {expandedUser === user.id ? '▼' : '▶'}
                    </button>
                  </td>
                </tr>
                {expandedUser === user.id && (
                  <tr>
                    <td colSpan={7} className="p-3 bg-muted/30">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Status Trail for {user.name}</h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {user.statusTrail.slice().reverse().map((entry, index) => (
                            <div key={`${user.id}-trail-${index}`} className="flex items-center gap-3 text-xs p-2 bg-background rounded">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusDisplay(entry.status).bgColor}`}>
                                {getStatusDisplay(entry.status).label}
                              </span>
                              <span className="text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                              <span className="text-muted-foreground capitalize">
                                via {entry.source}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
              <p className="text-muted-foreground mt-2">Monitor all portal activity and student status</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Real-time Status Indicator */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live data from database</span>
              <span>•</span>
              <span>Total: {users.length} students</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <span className="ml-2 text-green-600">• Auto-refresh: 30s</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">            

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inside Gate Not Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{gateInUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Gate-In</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gate In and Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{regInUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Registration-In</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registered Out but Gate In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{regOutUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Registration-Out</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outside Gate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{gateOutUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Gate-Out</p>
              </CardContent>
            </Card>

          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Status Overview</CardTitle>
              <CardDescription>View detailed status of all students</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="gate-out" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="gate-out">Outside Gate ({gateOutUsers.length})</TabsTrigger>
                  <TabsTrigger value="gate-in">Inside Gate ({gateInUsers.length})</TabsTrigger>
                  <TabsTrigger value="reg-in">Registered In ({regInUsers.length})</TabsTrigger>
                  <TabsTrigger value="reg-out">Registered Out ({regOutUsers.length})</TabsTrigger>
                  <TabsTrigger value="band-search">Band Search</TabsTrigger>
                </TabsList>

                <TabsContent value="gate-out" className="mt-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-600">Students Outside Gate</h3>
                    <p className="text-sm text-muted-foreground">Students who are currently outside the campus gates</p>
                  </div>
                  <UserTable users={gateOutUsers} />
                </TabsContent>

                <TabsContent value="gate-in" className="mt-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-green-600">Students Inside Gate</h3>
                    <p className="text-sm text-muted-foreground">Students who have entered the campus but haven't registered yet</p>
                  </div>
                  <UserTable users={gateInUsers} />
                </TabsContent>

                <TabsContent value="reg-in" className="mt-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-600">Currently Registered Students</h3>
                    <p className="text-sm text-muted-foreground">Students who are registered in and participating in events</p>
                  </div>
                  <UserTable users={regInUsers} />
                </TabsContent>

                <TabsContent value="reg-out" className="mt-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-purple-600">Registration Complete</h3>
                    <p className="text-sm text-muted-foreground">Students who have registered but haven't left the gate</p>
                  </div>
                  <UserTable users={regOutUsers} />
                </TabsContent>

                <TabsContent value="band-search" className="mt-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Band Search</h3>
                    <p className="text-sm text-muted-foreground">Find all participants assigned to a specific band number</p>
                  </div>
                  <div className="mb-4 max-w-xs">
                    <Input
                      placeholder="Enter band number e.g. B3"
                      value={bandQuery}
                      onChange={(e) => setBandQuery(e.target.value)}
                    />
                  </div>
                  {bandQuery.trim() && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {bandUsers.length} participant{bandUsers.length !== 1 ? "s" : ""} found for band <strong>{bandQuery.trim()}</strong>
                    </p>
                  )}
                  {bandQuery.trim() && <UserTable users={bandUsers} />}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
