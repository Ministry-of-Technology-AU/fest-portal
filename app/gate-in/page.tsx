"use client"

import { useState } from "react"
import { DoorOpen, Loader2, LogIn, LogOut } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { UserSearch } from "@/components/user-search"
import { StudentSummary } from "@/components/student-summary"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"
import type { StatusAction } from "@/lib/transitions"
import { TRANSITIONS } from "@/lib/transitions"
import { recordStatusChange, refreshStudent } from "@/lib/offline/engine"
import { useStudent } from "@/lib/offline/hooks"
import { announceResult } from "@/lib/offline/feedback"

export default function GateInPage() {
  const [picked, setPicked] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  // Follows background syncs, so the status shown is the latest this device knows
  const selectedUser = useStudent(picked?.id ?? null, picked)

  const selectUser = (user: User | null) => {
    setPicked(user)
    if (user) refreshStudent(user.id)
  }

  const handleAction = async (action: StatusAction) => {
    if (!selectedUser || actionLoading) return

    try {
      setActionLoading(true)
      const result = await recordStatusChange(selectedUser, action)
      if (announceResult(result, TRANSITIONS[action].label, selectedUser)) selectUser(null)
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
        <UserSearch onSelectUser={selectUser} />

        {selectedUser ? (
          <StudentSummary
            key={selectedUser.id}
            user={selectedUser}
            onClear={() => selectUser(null)}
            actions={
              <>
                <Button onClick={() => handleAction("gate-in")} disabled={actionLoading} variant="success" size="xl">
                  {actionLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Gate-In
                </Button>
                <Button onClick={() => handleAction("gate-out")} disabled={actionLoading} size="xl">
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
