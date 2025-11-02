"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { UserSearch } from "@/components/user-search"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User, SecurityStatus } from "@/lib/types"
import { dummyUsers } from "@/lib/dummy-data"

export default function RegistrationPage() {
  const [users, setUsers] = useState<User[]>(dummyUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

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

  const updateUserStatus = (newStatus: SecurityStatus) => {
    if (!selectedUser) return

    const timestamp = new Date().toISOString()
    const updatedUsers = users.map((u) =>
      u.id === selectedUser.id
        ? {
            ...u,
            currentStatus: newStatus,
            lastStatusTime: timestamp,
            statusTrail: [
              ...u.statusTrail,
              {
                status: newStatus,
                timestamp: timestamp,
                source: "registration" as const
              }
            ]
          }
        : u,
    )
    setUsers(updatedUsers)
    localStorage.setItem("portalUsers", JSON.stringify(updatedUsers))
    
    // Show success toast
    const statusLabels = {
      "gate-in": "Gate-In",
      "gate-out": "Gate-Out",
      "reg-in": "Registration-In",
      "reg-out": "Registration-Out",
    }
    
    toast.success(`${statusLabels[newStatus]} completed for ${selectedUser.name}`, {
      description: `Student ${selectedUser.id} is now ${statusLabels[newStatus].toLowerCase()}`,
    })
    
    setSelectedUser(null)
  }

  const handleRegIn = () => {
    if (!selectedUser) return
    if (selectedUser.currentStatus !== "gate-in") {
      toast.error("Cannot Registration-In", {
        description: "Student must complete Gate-In before Registration-In",
      })
      return
    }
    updateUserStatus("reg-in")
  }

  const handleRegOut = () => {
    if (!selectedUser) return
    if (selectedUser.currentStatus !== "reg-in") {
      toast.error("Invalid Action", {
        description: "Student must be registered-in to perform registration-out",
      })
      return
    }
    updateUserStatus("reg-out")
  }

  const getNextActions = (status: SecurityStatus) => {
    switch (status) {
      case "gate-out":
        return ["gate-in"]
      case "gate-in":
        return ["gate-out", "reg-in"]
      case "reg-in":
        return ["reg-out"]
      case "reg-out":
        return ["gate-out"]
      default:
        return []
    }
  }

  const canPerformAction = (action: string) => {
    if (!selectedUser) return false
    return getNextActions(selectedUser.currentStatus).includes(action)
  }

  const getStatusDisplay = (status: SecurityStatus) => {
    const statusConfig = {
      "gate-out": { label: "Gate-Out", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
      "gate-in": { label: "Gate-In", color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" },
      "reg-in": { label: "Registration-In", color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" },
      "reg-out": { label: "Registration-Out", color: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300" },
    }
    return statusConfig[status]
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Registration Management</h2>
            <p className="text-muted-foreground mt-2">Check students in and out for registration</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Student</CardTitle>
              <CardDescription>Find student by ID or name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UserSearch users={users} onSelectUser={setSelectedUser} />

              {selectedUser && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Student ID</p>
                        <p className="font-semibold">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">College</p>
                        <p className="font-semibold">{selectedUser.collegeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-sm">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold">{selectedUser.phoneNumber}</p>
                      </div>
                    </div>

                    {/* Events Registered */}
                    <div className="bg-secondary/20 p-3 rounded border">
                      <p className="text-sm text-muted-foreground mb-2">Events Registered</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.eventsRegistered.map((event, index) => (
                          <span
                            key={index}
                            className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Visit Dates */}
                    <div className="bg-secondary/20 p-3 rounded border">
                      <p className="text-sm text-muted-foreground mb-2">Visit Dates</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.visitDates.map((date, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium"
                          >
                            {new Date(date).toLocaleDateString()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="bg-secondary/20 p-3 rounded border">
                      <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay(selectedUser.currentStatus).color}`}>
                          {getStatusDisplay(selectedUser.currentStatus).label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedUser.lastStatusTime).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Status Trail */}
                    {/* <div className="bg-secondary/20 p-3 rounded border">
                      <p className="text-sm text-muted-foreground mb-2">Status History ({selectedUser.statusTrail.length} entries)</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedUser.statusTrail.slice().reverse().slice(0, 5).map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusDisplay(entry.status).color}`}>
                              {getStatusDisplay(entry.status).label}
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-muted-foreground capitalize text-xs">
                              ({entry.source})
                            </span>
                          </div>
                        ))}
                        {selectedUser.statusTrail.length > 5 && (
                          <p className="text-xs text-muted-foreground italic">
                            + {selectedUser.statusTrail.length - 5} more entries
                          </p>
                        )}
                      </div>
                    </div> */}

                    {/* Next Available Actions */}
                    {/* <div className="bg-secondary/20 p-3 rounded border">
                      <p className="text-sm text-muted-foreground mb-2">Available Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {getNextActions(selectedUser.currentStatus).map((action) => (
                          <span
                            key={action}
                            className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-md text-xs font-medium"
                          >
                            {action === "gate-in" ? "Gate-In" : action === "gate-out" ? "Gate-Out" : action === "reg-in" ? "Registration-In" : "Registration-Out"}
                          </span>
                        ))}
                      </div>
                    </div> */}

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleRegIn}
                        disabled={!canPerformAction("reg-in")}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Registration In
                      </Button>
                      <Button
                        onClick={handleRegOut}
                        disabled={!canPerformAction("reg-out")}
                        className="flex-1 bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Registration Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
