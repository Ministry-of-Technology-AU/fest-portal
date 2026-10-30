"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, UsersRound } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface FestUser {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function FestUserManagementPage() {
  const [festUsers, setFestUsers] = useState<FestUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'fest'
  })

  // Fetch fest users
  const fetchFestUsers = async () => {
    try {
      const response = await fetch('/api/fest-users')
      if (response.ok) {
        const users = await response.json()
        setFestUsers(users)
      } else {
        toast.error('Failed to fetch fest users')
      }
    } catch (error) {
      toast.error('Error fetching fest users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFestUsers()
  }, [])

  // Create new fest user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/fest-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Fest user created successfully!')
        setFormData({ username: '', password: '', email: '', role: 'fest' })
        setIsCreateOpen(false)
        fetchFestUsers() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to create fest user')
      }
    } catch (error) {
      toast.error('Error creating fest user')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete fest user
  const handleDeleteUser = async (userId: string, username: string) => {
    try {
      const response = await fetch(`/api/fest-users?userId=${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`User "${username}" deleted successfully`)
        fetchFestUsers() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Error deleting user')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-4">Loading fest users...</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        icon={UsersRound}
        eyebrow="Admin"
        title="Fest User Management"
        description="Create and manage fest user accounts for portal access."
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus />
                Create Fest User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Fest User</DialogTitle>
                <DialogDescription>
                  Create a new fest user account with username and password for portal access.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    autoCapitalize="none"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fest">Fest User</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Fest Users <span className="font-mono text-base font-normal text-muted-foreground">({festUsers.length})</span>
          </CardTitle>
          <CardDescription>
            Manage fest user accounts that can access the portal using username/password authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {festUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <UsersRound className="mx-auto mb-3 size-10 text-primary/40" />
              <p className="font-semibold">No fest users found</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first fest user to get started</p>
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0 sm:rounded-lg sm:border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-y bg-muted/70 text-left text-xs tracking-wider text-muted-foreground uppercase sm:border-t-0">
                    <th className="px-4 py-3 font-bold">Username</th>
                    <th className="hidden px-4 py-3 font-bold sm:table-cell">Email</th>
                    <th className="px-4 py-3 font-bold">Role</th>
                    <th className="hidden px-4 py-3 font-bold md:table-cell">Created</th>
                    <th className="px-4 py-3 text-right font-bold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {festUsers.map((user) => (
                    <tr key={user.id} className="border-b transition-colors last:border-b-0 hover:bg-accent/60">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{user.username}</div>
                        <div className="truncate text-xs text-muted-foreground sm:hidden">{user.email}</div>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                            user.role === 'fest'
                              ? 'bg-blue/10 text-blue-dark ring-blue/25 dark:text-blue-extralight'
                              : 'bg-green/12 text-green-dark ring-green/30 dark:text-green-light'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${user.username}`}
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Fest User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the user &quot;{user.username}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
