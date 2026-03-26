"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Navigation } from "@/components/navigation"
import { UserSearch } from "@/components/user-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { User } from "@/lib/types"
import { useUsers, updateUser } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function UserManagementPage() {
  const { users, loading, error, refetch } = useUsers()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editData, setEditData] = useState<Partial<User>>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    collegeName: '',
    eventsRegistered: [] as string[],
  })
  const [availableEvents, setAvailableEvents] = useState<string[]>([])
  const [fetchingEvents, setFetchingEvents] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setFetchingEvents(true)
        const response = await fetch('/api/events')
        if (response.ok) {
          const data = await response.json()
          setAvailableEvents(data.events.map((e: any) => e.name))
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setFetchingEvents(false)
      }
    }
    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-red-500">Error: {error}</div>
        </main>
      </div>
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userData: {
            name: newUserData.name,
            email: newUserData.email,
            phoneNumber: newUserData.phoneNumber,
            collegeName: newUserData.collegeName || undefined,
            eventsRegistered: newUserData.eventsRegistered,
          }
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("User created successfully", {
          description: `${newUserData.name} has been added with ID: ${result.user.id}`,
          style: {
            background: '#10b981',
            color: 'white',
            border: '1px solid #059669'
          }
        })
        setNewUserData({ name: '', email: '', phoneNumber: '', collegeName: '', eventsRegistered: [] })
        setIsAddOpen(false)
        await refetch()
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Error creating user')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">User Management</h2>
            <p className="text-muted-foreground mt-2">Update or replace student information</p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Add a new student to your fest. An ID will be auto-generated.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="new-name" className="mb-2 block">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="new-name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-email" className="mb-2 block">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-phone" className="mb-2 block">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="new-phone"
                    value={newUserData.phoneNumber}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-college" className="mb-2 block">College Name</Label>
                  <Input
                    id="new-college"
                    value={newUserData.collegeName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, collegeName: e.target.value }))}
                    placeholder="Enter college name"
                    required
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Register for Events</Label>
                  <Card className="border p-0">
                    <ScrollArea className="h-[150px] p-2">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableEvents.length > 0 ? (
                          availableEvents.map((event) => (
                            <div key={event} className="flex items-center space-x-2 p-1">
                              <Checkbox 
                                id={`new-event-${event}`} 
                                checked={newUserData.eventsRegistered.includes(event)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewUserData(prev => ({ ...prev, eventsRegistered: [...prev.eventsRegistered, event] }))
                                  } else {
                                    setNewUserData(prev => ({ ...prev, eventsRegistered: prev.eventsRegistered.filter(e => e !== event) }))
                                  }
                                }}
                              />
                              <label
                                htmlFor={`new-event-${event}`}
                                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {event}
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full p-2 text-center text-xs text-muted-foreground italic">
                            {fetchingEvents ? 'Loading events...' : 'No events found. Type below to add manual ones.'}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                  
                  <div className="mt-2">
                    <Label htmlFor="new-manual-event" className="text-[10px] text-muted-foreground">Add Custom Event</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="new-manual-event"
                        placeholder="Type event name..."
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.currentTarget as HTMLInputElement).value.trim();
                            if (val && !newUserData.eventsRegistered.includes(val)) {
                              setNewUserData(prev => ({ ...prev, eventsRegistered: [...prev.eventsRegistered, val] }));
                              (e.currentTarget as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {newUserData.eventsRegistered.map(event => (
                      <Badge key={event} variant="secondary" className="text-[10px] pr-1">
                        {event}
                        <button 
                          className="ml-1 hover:text-destructive"
                          onClick={() => setNewUserData(prev => ({ ...prev, eventsRegistered: prev.eventsRegistered.filter(e => e !== event) }))}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Add User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    <div className="col-span-2">
                      <label className="text-sm font-medium mb-2 block">Events Registered</label>
                      <Card className="border p-0 mb-3">
                        <ScrollArea className="h-[150px] p-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {availableEvents.length > 0 ? (
                              availableEvents.map((event) => (
                                <div key={event} className="flex items-center space-x-2 p-1">
                                  <Checkbox 
                                    id={`edit-event-${event}`} 
                                    checked={editData.eventsRegistered?.includes(event) || false}
                                    onCheckedChange={(checked) => {
                                      const current = editData.eventsRegistered || [];
                                      if (checked) {
                                        setEditData({ ...editData, eventsRegistered: [...current, event] })
                                      } else {
                                        setEditData({ ...editData, eventsRegistered: current.filter((e: string) => e !== event) })
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`edit-event-${event}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {event}
                                  </label>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full p-2 text-center text-xs text-muted-foreground italic">
                                {fetchingEvents ? 'Loading events...' : 'No existing events found.'}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </Card>

                      <div className="flex flex-wrap gap-1">
                        {editData.eventsRegistered?.map((event: string) => (
                          <Badge key={event} variant="secondary" className="pr-1">
                            {event}
                            <button 
                              className="ml-1 hover:text-destructive"
                              onClick={() => {
                                const current = editData.eventsRegistered || [];
                                setEditData({ ...editData, eventsRegistered: current.filter((e: string) => e !== event) })
                              }}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
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
  )
}
