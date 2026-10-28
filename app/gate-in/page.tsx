"use client"

import { useState } from "react"
import { toast } from "sonner"
import { DoorOpen, Loader2, LogIn, LogOut } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { UserSearch } from "@/components/user-search"
import { StudentSummary } from "@/components/student-summary"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"
import { updateGateStatus } from "@/lib/api"

export default function GateInPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleGateIn = async () => {
    if (!selectedUser || actionLoading) return

    try {
      setActionLoading(true)
      await updateGateStatus(selectedUser.id, "gate-in")

      toast.success(`Gate-In completed for ${selectedUser.name}`, {
        description: `Student ${selectedUser.id} is now gate-in`,
      })

      // Refresh the users list and clear selection
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to update status", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleGateOut = async () => {
    if (!selectedUser || actionLoading) return

    try {
      setActionLoading(true)
      await updateGateStatus(selectedUser.id, "gate-out")

      toast.success(`Gate-Out completed for ${selectedUser.name}`, {
        description: `Student ${selectedUser.id} is now gate-out`,
      })

      // Refresh the users list and clear selection
      setSelectedUser(null)
    } catch (error) {
      toast.error("Failed to update status", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AppShell width="narrow">
      <PageHeader
        icon={DoorOpen}
        eyebrow="Gate desk"
        title="Gate-In / Out"
        description="Find a student, then check them in or out at the gate."
      />

      <div className="space-y-5">
        <UserSearch onSelectUser={setSelectedUser} />

        {selectedUser ? (
          <StudentSummary
            key={selectedUser.id}
            user={selectedUser}
            onClear={() => setSelectedUser(null)}
            actions={
              <>
                <Button onClick={handleGateIn} disabled={actionLoading} variant="success" size="xl">
                  {actionLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Gate-In
                </Button>
                <Button onClick={handleGateOut} disabled={actionLoading} size="xl">
                  {actionLoading ? <Loader2 className="animate-spin" /> : <LogOut />}
                  Gate-Out
                </Button>
              </>
            }
          />
        ) : (
          <EmptyPrompt />
        )}
      </div>
    </AppShell>
  )
}

function EmptyPrompt() {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
      <DoorOpen className="mx-auto mb-3 size-8 text-primary/40" />
      <p className="font-semibold">No student selected</p>
      <p className="mt-1 text-sm text-muted-foreground">Search above to pull up a student&apos;s pass.</p>
    </div>
  )
}
