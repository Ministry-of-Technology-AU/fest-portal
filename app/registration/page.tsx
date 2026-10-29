"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useOperator } from "@/components/offline-provider"
import { ClipboardCheck, Flag, Loader2, LogIn, LogOut } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { UserSearch } from "@/components/user-search"
import { StudentSummary } from "@/components/student-summary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User } from "@/lib/types"
import type { StatusAction } from "@/lib/transitions"
import { TRANSITIONS } from "@/lib/transitions"
import { recordStatusChange, refreshStudent } from "@/lib/offline/engine"
import { useStudent } from "@/lib/offline/hooks"
import { announceResult } from "@/lib/offline/feedback"

export default function RegistrationPage() {
  const { session } = useOperator()
  const [picked, setPicked] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [bandNumber, setBandNumber] = useState("")
  const [inDeskNumber, setInDeskNumber] = useState("")
  const [outDeskNumber, setOutDeskNumber] = useState("")
  const [flagNote, setFlagNote] = useState("")

  const isBanjaara = session?.user?.name === "banjaara"
  // Follows background syncs, so the status shown is the latest this device knows
  const selectedUser = useStudent(picked?.id ?? null, picked)

  const handleSelectUser = (user: User | null) => {
    setPicked(user)
    if (user) refreshStudent(user.id)
    if (isBanjaara && user?.additionalParams) {
      setBandNumber((user.additionalParams.bandNumber as string) ?? "")
      setInDeskNumber((user.additionalParams.inDeskNumber as string) ?? "")
      setOutDeskNumber((user.additionalParams.outDeskNumber as string) ?? "")
      setFlagNote((user.additionalParams.flagNote as string) ?? "")
    } else {
      setBandNumber("")
      setInDeskNumber("")
      setOutDeskNumber("")
      setFlagNote("")
    }
  }

  const handleAction = async (action: StatusAction) => {
    if (!selectedUser || actionLoading) return

    if (isBanjaara && action === "reg-in" && (!bandNumber.trim() || !inDeskNumber.trim())) {
      toast.error("Band number and in-desk number are required")
      return
    }
    if (isBanjaara && action === "reg-out" && !outDeskNumber.trim()) {
      toast.error("Out-desk number is required")
      return
    }

    const additionalParams = !isBanjaara
      ? undefined
      : action === "reg-in"
        ? { bandNumber: bandNumber.trim(), inDeskNumber: inDeskNumber.trim(), flagNote: flagNote.trim() }
        : { outDeskNumber: outDeskNumber.trim() }

    try {
      setActionLoading(true)
      const result = await recordStatusChange(selectedUser, action, additionalParams)
      if (announceResult(result, TRANSITIONS[action].label, selectedUser)) handleSelectUser(null)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <AppShell width="narrow">
      <PageHeader
        icon={ClipboardCheck}
        eyebrow="Registration desk"
        title="Registration"
        description="Find a student, then register them in or out."
      />

      <div className="space-y-5">
        <UserSearch onSelectUser={handleSelectUser} />

        {selectedUser ? (
          <StudentSummary
            key={selectedUser.id}
            user={selectedUser}
            onClear={() => handleSelectUser(null)}
            actions={
              <>
                <Button onClick={() => handleAction("reg-in")} disabled={actionLoading} variant="success" size="xl">
                  {actionLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Reg In
                </Button>
                <Button onClick={() => handleAction("reg-out")} disabled={actionLoading} size="xl">
                  {actionLoading ? <Loader2 className="animate-spin" /> : <LogOut />}
                  Reg Out
                </Button>
              </>
            }
          >
            {isBanjaara && (
              <div className="space-y-3 border-t pt-5">
                {!!selectedUser.additionalParams?.flagNote && (
                  <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                    <Flag className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-bold text-destructive">Flagged</p>
                      <p className="text-sm text-destructive/90">{String(selectedUser.additionalParams.flagNote)}</p>
                    </div>
                  </div>
                )}
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Banjaara details</p>
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bandNumber">Band Number</Label>
                    <Input
                      id="bandNumber"
                      placeholder="e.g. B3"
                      value={bandNumber}
                      onChange={(e) => setBandNumber(e.target.value)}
                      className="h-10 bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="inDeskNumber">In-Desk Number</Label>
                    <Input
                      id="inDeskNumber"
                      placeholder="e.g. D5"
                      value={inDeskNumber}
                      onChange={(e) => setInDeskNumber(e.target.value)}
                      className="h-10 bg-card"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="outDeskNumber">Out-Desk Number</Label>
                    <Input
                      id="outDeskNumber"
                      placeholder="e.g. D2"
                      value={outDeskNumber}
                      onChange={(e) => setOutDeskNumber(e.target.value)}
                      className="h-10 bg-card"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="flagNote">
                    Flag Note <span className="text-xs font-normal text-muted-foreground">(leave empty to unflag)</span>
                  </Label>
                  <Input
                    id="flagNote"
                    placeholder="Reason for flagging..."
                    value={flagNote}
                    onChange={(e) => setFlagNote(e.target.value)}
                    className="h-10 bg-card"
                  />
                </div>
              </div>
            )}
          </StudentSummary>
        ) : (
          <div className="rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
            <ClipboardCheck className="mx-auto mb-3 size-8 text-primary/40" />
            <p className="font-semibold">No student selected</p>
            <p className="mt-1 text-sm text-muted-foreground">Search above to pull up a student&apos;s pass.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
