import { toast } from 'sonner'
import type { User } from '@/lib/types'
import type { RecordResult } from '@/lib/offline/engine'

/** Tells the operator what happened to a scan; returns whether it was recorded */
export function announceResult(result: RecordResult, label: string, student: User): boolean {
  if (!result.ok) {
    toast.error(`Can't do ${label}`, { description: result.error })
    return false
  }

  if (result.outcome === 'synced') {
    toast.success(`${label} completed for ${student.name}`, { description: `Student ${student.id}` })
  } else if (result.outcome === 'pending') {
    toast.success(`${label} saved for ${student.name}`, {
      description: "Saved on this device. It'll be sent as soon as the connection allows.",
    })
  }
  // 'rejected' already raised its own error toast from the sync engine
  return true
}
