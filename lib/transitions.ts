import type { SecurityStatus } from '@/lib/types'

export type StatusAction = 'gate-in' | 'gate-out' | 'reg-in' | 'reg-out'

export type Desk = 'gate' | 'registration'

interface Transition {
  desk: Desk
  /** Statuses the action can be applied from */
  from: SecurityStatus[]
  to: SecurityStatus
  label: string
}

// Shared by the API routes (which enforce it) and the offline queue (which
// checks it against the cached status before saving a scan)
export const TRANSITIONS: Record<StatusAction, Transition> = {
  'gate-in': { desk: 'gate', from: ['gate-out'], to: 'gate-in', label: 'Gate-In' },
  'gate-out': { desk: 'gate', from: ['reg-out', 'gate-in'], to: 'gate-out', label: 'Gate-Out' },
  'reg-in': { desk: 'registration', from: ['gate-in'], to: 'reg-in', label: 'Registration-In' },
  'reg-out': { desk: 'registration', from: ['reg-in'], to: 'reg-out', label: 'Registration-Out' },
}

/** The transition for an action at a desk, or null if that desk can't perform it */
export function transitionFor(desk: Desk, action: unknown): Transition | null {
  const transition = TRANSITIONS[action as StatusAction]
  return transition && transition.desk === desk ? transition : null
}
