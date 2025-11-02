export type SecurityStatus = 'gate-out' | 'gate-in' | 'reg-in' | 'reg-out'

export interface StatusTrailEntry {
  status: SecurityStatus
  timestamp: string
  source: 'gate' | 'registration' | 'admin' | 'system'
}

export interface User {
  id: string // 6-digit ID
  name: string
  collegeName: string
  email: string
  phoneNumber: string
  eventsRegistered: string[]
  visitDates: string[]
  currentStatus: SecurityStatus
  lastStatusTime: string
  statusTrail: StatusTrailEntry[]
  // Legacy fields - keeping for backward compatibility
  gateInTime?: string
  gateOutTime?: string
  regInTime?: string
  regOutTime?: string
}

export interface PortalStatus {
  gateIn: boolean
  regIn: boolean
}
