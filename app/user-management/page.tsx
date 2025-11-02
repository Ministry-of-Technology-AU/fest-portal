"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AuthGuard } from "@/components/auth-guard"
import { Navigation } from "@/components/navigation"
import { UserSearch } from "@/components/user-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/types"
import { useUsers, updateUser } from "@/lib/api"

export default function UserManagementPage() {
  const { users, loading, error, refetch } = useUsers()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editData, setEditData] = useState<Partial<User>>({})
  const [actionLoading, setActionLoading] = useState(false)

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center text-red-500">Error: {error}</div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setEditData(user)
  }

  const handleUpdate = async () => {
    if (!selectedUser || actionLoading) return

    try {
      setActionLoading(true)
      await updateUser(selectedUser.id, editData)
      
      toast.success("User updated successfully", {
        description: `Information for ${selectedUser.name} has been updated`,
        style: {
          background: '#10b981',
          color: 'white',
          border: '1px solid #059669'
        }
      })
      
      // Refresh the users list and clear selection
      await refetch()
      setSelectedUser(null)
      setEditData({})
    } catch (error) {
      toast.error("Failed to update user", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        style: {
          background: '#ef4444',
          color: 'white',
          border: '1px solid #dc2626'
        }
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">User Management</h2>
            <p className="text-muted-foreground mt-2">Update or replace student information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Search Student</CardTitle>
              <CardDescription>Find student by ID or name to edit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UserSearch users={users} onSelectUser={handleSelectUser} />

              {selectedUser && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Edit Student Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={editData.name || ""}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Student ID</label>
                        <Input value={editData.id || ""} disabled className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">College Name</label>
                        <Input
                          value={editData.collegeName || ""}
                          onChange={(e) => setEditData({ ...editData, collegeName: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          value={editData.email || ""}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                          value={editData.phoneNumber || ""}
                          onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleUpdate}
                        disabled={actionLoading}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? "Updating..." : "Update Information"}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedUser(null)
                          setEditData({})
                        }}
                        variant="outline"
                        className="flex-1"
                        disabled={actionLoading}
                      >
                        Cancel
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
