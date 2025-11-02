"use client"

import React, { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User, SecurityStatus } from "@/lib/types"
import { dummyUsers } from "@/lib/dummy-data"

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>(dummyUsers)

  useEffect(() => {
    const stored = localStorage.getItem("portalUsers")
    if (stored) {
      try {
        const parsedUsers = JSON.parse(stored)
        // Migrate old data format to new format
        const migratedUsers = parsedUsers.map((user: any) => ({
          ...user,
          currentStatus: user.currentStatus || getStatusFromLegacyFields(user),
          lastStatusTime: user.lastStatusTime || new Date().toISOString(),
          statusTrail: user.statusTrail || [
            {
              status: user.currentStatus || getStatusFromLegacyFields(user),
              timestamp: user.lastStatusTime || new Date().toISOString(),
              source: "system"
            }
          ],
        }))
        setUsers(migratedUsers)
      } catch (error) {
        console.error("Error parsing stored users:", error)
        setUsers(dummyUsers)
      }
    }
  }, [])

  // Helper function to migrate legacy data
  const getStatusFromLegacyFields = (user: any): SecurityStatus => {
    if (user.regOutTime) return "reg-out"
    if (user.regInTime) return "reg-in"
    if (user.gateInTime) return "gate-in"
    return "gate-out"
  }

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
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
            <p className="text-muted-foreground mt-2">Monitor all portal activity and student status</p>
          </div>

          {/* Flow Overview */}
          {/* <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Security Flow Overview</CardTitle>
              <CardDescription>Gate-Out → Gate-In → Registration-In → Registration-Out → Gate-Out</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">OUT</span>
                    </div>
                    <p className="text-xs mt-1 text-gray-600">{gateOutUsers.length}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">IN</span>
                    </div>
                    <p className="text-xs mt-1 text-green-600">{gateInUsers.length}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">REG</span>
                    </div>
                    <p className="text-xs mt-1 text-blue-600">{regInUsers.length}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">DONE</span>
                    </div>
                    <p className="text-xs mt-1 text-purple-600">{regOutUsers.length}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">OUT</span>
                    </div>
                    <p className="text-xs mt-1 text-gray-600">Exit</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">            

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inside Gate Not Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{gateInUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Gate-In</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gate In and Registered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{regInUsers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Registration-In</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Registered Out but Gate In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{regOutUsers.length}</div>
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="gate-out">Outside Gate ({gateOutUsers.length})</TabsTrigger>
                  <TabsTrigger value="gate-in">Inside Gate ({gateInUsers.length})</TabsTrigger>
                  <TabsTrigger value="reg-in">Registered In ({regInUsers.length})</TabsTrigger>
                  <TabsTrigger value="reg-out">Registered Out ({regOutUsers.length})</TabsTrigger>
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
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
