"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Loader2, Plus, Save, UserCog, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { StatusPill } from "@/components/status-pill"
import { UserSearch } from "@/components/user-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { User } from "@/lib/types"
import { updateUser } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function UserManagementPage() {
  const { data: session } = useSession()
  const isBanjaara = session?.user?.name === "banjaara"
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
        description: `Information for ${selectedUser.name} has been updated`
      })

      // Refresh the users list and clear selection
      setSelectedUser(null)
      setEditData({})
    } catch (error) {
      toast.error("Failed to update user", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
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
          description: `${newUserData.name} has been added with ID: ${result.user.id}`
        })
        setNewUserData({ name: '', email: '', phoneNumber: '', collegeName: '', eventsRegistered: [] })
        setIsAddOpen(false)
        } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Error creating user')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleEvent = (list: string[], event: string, checked: boolean) =>
    checked ? [...list, event] : list.filter((e) => e !== event)

  return (
    <AppShell width="narrow">
      <PageHeader
        icon={UserCog}
        eyebrow="Records"
        title="User Management"
        description="Update or replace student information."
        actions={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Add a new student to your fest. An ID will be auto-generated.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-name">Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="new-name"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-phone">Phone <span className="text-destructive">*</span></Label>
                    <Input
                      id="new-phone"
                      type="tel"
                      value={newUserData.phoneNumber}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Phone number"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-college">College Name</Label>
                  <Input
                    id="new-college"
                    value={newUserData.collegeName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, collegeName: e.target.value }))}
                    placeholder="Enter college name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Register for Events</Label>
                  <div className="rounded-lg border bg-muted/30">
                    <ScrollArea className="h-[150px] p-2">
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {availableEvents.length > 0 ? (
                          availableEvents.map((event) => (
                            <label
                              key={event}
                              htmlFor={`new-event-${event}`}
                              className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm font-medium hover:bg-accent"
                            >
                              <Checkbox
                                id={`new-event-${event}`}
                                checked={newUserData.eventsRegistered.includes(event)}
                                onCheckedChange={(checked) =>
                                  setNewUserData(prev => ({ ...prev, eventsRegistered: toggleEvent(prev.eventsRegistered, event, !!checked) }))
                                }
                              />
                              {event}
                            </label>
                          ))
                        ) : (
                          <div className="col-span-full p-2 text-center text-xs text-muted-foreground italic">
                            {fetchingEvents ? 'Loading events...' : 'No events found. Type below to add manual ones.'}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <Input
                    id="new-manual-event"
                    aria-label="Add custom event"
                    placeholder="Add a custom event and press Enter"
                    className="mt-2 h-9 text-sm"
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

                  {newUserData.eventsRegistered.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {newUserData.eventsRegistered.map(event => (
                        <Badge key={event} variant="secondary" className="gap-1 pr-1">
                          {event}
                          <button
                            type="button"
                            aria-label={`Remove ${event}`}
                            className="rounded-sm p-0.5 hover:bg-black/10 hover:text-destructive"
                            onClick={() => setNewUserData(prev => ({ ...prev, eventsRegistered: prev.eventsRegistered.filter(e => e !== event) }))}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="animate-spin" />}
                    {isCreating ? 'Creating...' : 'Add User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-5">
        <UserSearch onSelectUser={handleSelectUser} />

        {selectedUser ? (
          <section key={selectedUser.id} className="animate-rise overflow-hidden rounded-xl border border-primary/20 bg-card shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b bg-primary/[0.04] px-4 py-4 sm:px-6 dark:bg-primary/10">
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Editing</p>
                <h2 className="text-xl leading-tight font-extrabold break-words sm:text-2xl">{selectedUser.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-foreground/5 px-2 py-0.5 font-mono text-xs font-semibold tracking-wider dark:bg-white/10">
                    {selectedUser.id}
                  </span>
                  <StatusPill status={selectedUser.currentStatus} />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear selection"
                className="-mt-1 -mr-2 shrink-0"
                onClick={() => {
                  setSelectedUser(null)
                  setEditData({})
                }}
              >
                <X />
              </Button>
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-id">Student ID</Label>
                  <Input id="edit-id" value={editData.id || ""} disabled className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-college">College Name</Label>
                  <Input
                    id="edit-college"
                    value={editData.collegeName || ""}
                    onChange={(e) => setEditData({ ...editData, collegeName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editData.phoneNumber || ""}
                    onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-5">
                <Label>Events Registered</Label>
                <div className="rounded-lg border bg-muted/30">
                  <ScrollArea className="h-[150px] p-2">
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {availableEvents.length > 0 ? (
                        availableEvents.map((event) => (
                          <label
                            key={event}
                            htmlFor={`edit-event-${event}`}
                            className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm font-medium hover:bg-accent"
                          >
                            <Checkbox
                              id={`edit-event-${event}`}
                              checked={editData.eventsRegistered?.includes(event) || false}
                              onCheckedChange={(checked) =>
                                setEditData({ ...editData, eventsRegistered: toggleEvent(editData.eventsRegistered || [], event, !!checked) })
                              }
                            />
                            {event}
                          </label>
                        ))
                      ) : (
                        <div className="col-span-full p-2 text-center text-xs text-muted-foreground italic">
                          {fetchingEvents ? 'Loading events...' : 'No existing events found.'}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {!!editData.eventsRegistered?.length && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {editData.eventsRegistered.map((event: string) => (
                      <Badge key={event} variant="secondary" className="gap-1 pr-1">
                        {event}
                        <button
                          type="button"
                          aria-label={`Remove ${event}`}
                          className="rounded-sm p-0.5 hover:bg-black/10 hover:text-destructive"
                          onClick={() => {
                            const current = editData.eventsRegistered || [];
                            setEditData({ ...editData, eventsRegistered: current.filter((e: string) => e !== event) })
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {isBanjaara && (
                <div className="space-y-3 border-t pt-5">
                  <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Banjaara details</p>
                  <div className="grid grid-cols-1 gap-3 xs:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-band">Band Number</Label>
                      <Input
                        id="edit-band"
                        placeholder="e.g. B3"
                        value={(editData.additionalParams?.bandNumber as string) ?? ""}
                        onChange={(e) => setEditData({
                          ...editData,
                          additionalParams: { ...editData.additionalParams, bandNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-indesk">In-Desk Number</Label>
                      <Input
                        id="edit-indesk"
                        placeholder="e.g. D5"
                        value={(editData.additionalParams?.inDeskNumber as string) ?? ""}
                        onChange={(e) => setEditData({
                          ...editData,
                          additionalParams: { ...editData.additionalParams, inDeskNumber: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-outdesk">Out-Desk Number</Label>
                      <Input
                        id="edit-outdesk"
                        placeholder="e.g. D2"
                        value={(editData.additionalParams?.outDeskNumber as string) ?? ""}
                        onChange={(e) => setEditData({
                          ...editData,
                          additionalParams: { ...editData.additionalParams, outDeskNumber: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-flagnote">
                      Flag Note <span className="text-xs font-normal text-muted-foreground">(leave empty to unflag)</span>
                    </Label>
                    <Input
                      id="edit-flagnote"
                      placeholder="Reason for flagging..."
                      value={(editData.additionalParams?.flagNote as string) ?? ""}
                      onChange={(e) => setEditData({
                        ...editData,
                        additionalParams: { ...editData.additionalParams, flagNote: e.target.value }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t bg-muted/50 px-4 py-4 sm:px-6">
              <Button
                onClick={() => {
                  setSelectedUser(null)
                  setEditData({})
                }}
                variant="outline"
                size="xl"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={actionLoading} size="xl">
                {actionLoading ? <Loader2 className="animate-spin" /> : <Save />}
                {actionLoading ? "Updating..." : "Save"}
              </Button>
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
            <UserCog className="mx-auto mb-3 size-8 text-primary/40" />
            <p className="font-semibold">No student selected</p>
            <p className="mt-1 text-sm text-muted-foreground">Search above to find a student to edit.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
