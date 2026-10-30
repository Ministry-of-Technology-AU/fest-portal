import { toast } from 'sonner'
import type { User } from '@/lib/types'
import { TRANSITIONS, type StatusAction } from '@/lib/transitions'
import * as idb from '@/lib/offline/idb'

// Keeps a copy of the roster on the device and a queue of status changes that
// haven't reached the server yet, so the desks keep working on a bad connection.
//
// - Reads come from the cached roster straight away; it's re-synced in the
//   background every few seconds (only changed users) and fully every few minutes.
// - A scan is saved to the device first, then sent. Sends are retried in order
//   until the server answers. If the server refuses one (the status changed
//   somewhere else), it's flagged for the operator instead of retried.
// - The server stays the authority: it still checks every transition.

export interface QueuedChange {
  opId: string
  /** Account that recorded it; only that account's changes are sent */
  ownerId: string
  userId: string
  userName: string
  action: StatusAction
  additionalParams?: Record<string, unknown>
  scannedAt: string
  /** pending: still to be sent; rejected: the server refused it */
  state: 'pending' | 'rejected'
  error?: string
  attempts: number
}

export interface OfflineState {
  ownerId: string | null
  /** The cached roster has been read from the device */
  ready: boolean
  /** Users as the server last reported them (pending changes are applied on read) */
  users: ReadonlyMap<string, User>
  /** Server time of the last successful roster sync */
  syncedAt: string | null
  /** Whether the last request got an answer from the server */
  reachable: boolean
  /** The session ran out; nothing can be sent until the operator signs in again */
  authExpired: boolean
  /** This account's queued changes, oldest first */
  queue: QueuedChange[]
}

interface Meta {
  ownerId: string
  syncedAt: string | null
  fullSyncedAt: number | null
}

const SYNC_INTERVAL_MS = 5_000
const HIDDEN_SYNC_INTERVAL_MS = 30_000
const FULL_SYNC_INTERVAL_MS = 5 * 60_000
const MAX_RETRY_DELAY_MS = 30_000
const REQUEST_TIMEOUT_MS = 10_000
const FULL_SYNC_TIMEOUT_MS = 25_000
const REFRESH_TIMEOUT_MS = 4_000

const INITIAL_STATE: OfflineState = {
  ownerId: null,
  ready: false,
  users: new Map(),
  syncedAt: null,
  reachable: true,
  authExpired: false,
  queue: [],
}

let state = INITIAL_STATE
const listeners = new Set<() => void>()

function setState(patch: Partial<OfflineState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

export function getState() {
  return state
}

export function getServerState() {
  return INITIAL_STATE
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Writes to IndexedDB are best effort: if storage is unavailable (e.g. some
// private modes) everything still works in memory for this page load
function persist(write: Promise<unknown>) {
  write.catch((error) => console.error('Offline storage write failed:', error))
}

// ---------------------------------------------------------------------------
// Requests

class NetworkError extends Error {}
class AuthError extends Error {}
/** The server answered and refused the request */
class RejectedError extends Error {}

async function request<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) })
  } catch {
    throw new NetworkError('No connection')
  }

  // proxy.ts redirects signed-out API calls to the login page
  if (response.status === 401 || response.redirected) throw new AuthError('Signed out')
  // Timeouts and overloads (including Vercel's own HTML error pages) are worth retrying
  if (response.status >= 500 || response.status === 408 || response.status === 429) {
    throw new NetworkError(`Server error ${response.status}`)
  }

  let body: { error?: string } & T
  try {
    body = await response.json()
  } catch {
    throw new NetworkError('Unreadable response')
  }
  if (!response.ok) throw new RejectedError(body.error || `Request failed (${response.status})`)
  return body
}

function noteSuccess() {
  if (!state.reachable || state.authExpired) {
    setState({ reachable: true, authExpired: false })
    flush()
  }
}

function noteFailure(error: unknown) {
  if (error instanceof AuthError) setState({ authExpired: true })
  else if (error instanceof NetworkError) setState({ reachable: false })
  else console.error(error)
}

function retryDelay(failures: number) {
  return Math.min(MAX_RETRY_DELAY_MS, 1_000 * 2 ** Math.min(failures, 5))
}

// ---------------------------------------------------------------------------
// Roster

let fullSyncedAt: number | null = null
let syncing = false
let syncFailures = 0
let syncTimer: ReturnType<typeof setTimeout> | undefined

/** Keeps whichever copy of each user is newer, so a slow sync can't undo a fresher update */
function mergeUsers(base: ReadonlyMap<string, User>, incoming: User[]) {
  const users = new Map(base)
  for (const user of incoming) {
    const existing = users.get(user.id)
    if (existing && Date.parse(existing.lastStatusTime) > Date.parse(user.lastStatusTime)) continue
    users.set(user.id, user)
  }
  return users
}

async function syncRoster() {
  const full = !state.syncedAt || !fullSyncedAt || Date.now() - fullSyncedAt > FULL_SYNC_INTERVAL_MS
  const ownerId = state.ownerId
  if (!ownerId) return
  const url = full
    ? '/api/users?trail=0'
    : `/api/users?trail=0&since=${encodeURIComponent(state.syncedAt!)}`

  const data = await request<{ users: User[]; syncedAt: string }>(url, {}, full ? FULL_SYNC_TIMEOUT_MS : REQUEST_TIMEOUT_MS)
  if (state.ownerId !== ownerId) return

  if (full) {
    // A full sync also drops users deleted on the server
    const fresh = new Map(data.users.map((user) => [user.id, user]))
    const users = mergeUsers(fresh, [...state.users.values()].filter((user) => fresh.has(user.id)))
    fullSyncedAt = Date.now()
    setState({ users, syncedAt: data.syncedAt })
    persist(idb.replaceAll('roster', [...users.values()]))
  } else {
    if (data.users.length > 0) setState({ users: mergeUsers(state.users, data.users) })
    setState({ syncedAt: data.syncedAt })
    persist(idb.putMany('roster', data.users))
  }
  persist(idb.put('meta', { ownerId, syncedAt: data.syncedAt, fullSyncedAt } satisfies Meta, 'meta'))
}

function scheduleSync(delay: number) {
  clearTimeout(syncTimer)
  if (state.ownerId) syncTimer = setTimeout(runSync, delay)
}

async function runSync() {
  if (syncing || !state.ownerId || state.authExpired) return
  syncing = true
  try {
    await syncRoster()
    syncFailures = 0
    noteSuccess()
  } catch (error) {
    syncFailures++
    noteFailure(error)
  } finally {
    syncing = false
    const hidden = typeof document !== 'undefined' && document.hidden
    scheduleSync(syncFailures > 0 ? retryDelay(syncFailures) : hidden ? HIDDEN_SYNC_INTERVAL_MS : SYNC_INTERVAL_MS)
  }
}

/** Fetches one student's latest status, e.g. when a desk pulls them up. Fails quietly. */
export async function refreshStudent(id: string) {
  try {
    const data = await request<{ users: User[] }>(
      `/api/users/search?q=${encodeURIComponent(id)}`,
      {},
      REFRESH_TIMEOUT_MS
    )
    const user = data.users.find((candidate) => candidate.id === id)
    noteSuccess()
    if (!user || !state.ownerId) return
    setState({ users: mergeUsers(state.users, [user]) })
    persist(idb.put('roster', state.users.get(id)))
  } catch (error) {
    noteFailure(error)
  }
}

/** A user with this device's unsent changes applied on top of the server's copy */
export function effectiveUser(id: string, fallback?: User | null): User | undefined {
  const base = state.users.get(id) ?? fallback ?? undefined
  if (!base) return undefined

  let user = base
  for (const op of state.queue) {
    if (op.userId !== id || op.state !== 'pending') continue
    user = {
      ...user,
      currentStatus: TRANSITIONS[op.action].to,
      lastStatusTime: op.scannedAt,
      additionalParams: op.additionalParams ? { ...user.additionalParams, ...op.additionalParams } : user.additionalParams,
    }
  }
  return user
}

/** Same matching as /api/users/search: id, name, email or phone contains the query */
export function searchRoster(query: string, limit = 10): User[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const matches: User[] = []
  for (const user of state.users.values()) {
    if (
      user.id.toLowerCase().includes(q) ||
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phoneNumber.includes(q)
    ) {
      matches.push(user)
    }
  }
  return matches
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((user) => effectiveUser(user.id)!)
}

// ---------------------------------------------------------------------------
// Queue

type SendOutcome = 'synced' | 'rejected' | 'pending'

let flushing = false
let flushTimer: ReturnType<typeof setTimeout> | undefined
const waiters = new Map<string, (outcome: SendOutcome) => void>()

function settle(opId: string, outcome: SendOutcome) {
  waiters.get(opId)?.(outcome)
  waiters.delete(opId)
}

function replaceOp(op: QueuedChange) {
  setState({ queue: state.queue.map((existing) => (existing.opId === op.opId ? op : existing)) })
  persist(idb.put('queue', op))
}

function dropOp(opId: string) {
  setState({ queue: state.queue.filter((op) => op.opId !== opId) })
  persist(idb.remove('queue', opId))
}

async function send(op: QueuedChange): Promise<'done' | 'retry'> {
  const endpoint = TRANSITIONS[op.action].desk === 'gate' ? '/api/gate-in' : '/api/registration'

  try {
    const data = await request<{ user: { currentStatus: User['currentStatus']; lastStatusTime: string } }>(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: op.userId,
          action: op.action,
          additionalParams: op.additionalParams,
          opId: op.opId,
          scannedAt: op.scannedAt,
        }),
      },
      REQUEST_TIMEOUT_MS
    )

    // Fold the server's result into the roster before dropping the pending change
    const base = state.users.get(op.userId)
    if (base) {
      const updated: User = {
        ...base,
        currentStatus: data.user.currentStatus,
        lastStatusTime: new Date(data.user.lastStatusTime).toISOString(),
        additionalParams: op.additionalParams ? { ...base.additionalParams, ...op.additionalParams } : base.additionalParams,
      }
      setState({ users: new Map(state.users).set(op.userId, updated) })
      persist(idb.put('roster', updated))
    }
    dropOp(op.opId)
    noteSuccess()
    settle(op.opId, 'synced')
    return 'done'
  } catch (error) {
    if (error instanceof RejectedError) {
      replaceOp({ ...op, state: 'rejected', error: error.message })
      toast.error(`${TRANSITIONS[op.action].label} for ${op.userName} was rejected`, {
        description: error.message,
        duration: 10_000,
      })
      settle(op.opId, 'rejected')
      noteSuccess()
      // The cached status was wrong, so catch up straight away
      scheduleSync(0)
      return 'done'
    }

    noteFailure(error)
    replaceOp({ ...op, attempts: op.attempts + 1 })
    return 'retry'
  }
}

/** Sends pending changes in order, stopping at the first one that can't get through */
async function flush() {
  if (flushing || !state.ownerId || state.authExpired) return
  flushing = true
  clearTimeout(flushTimer)
  try {
    for (;;) {
      const op = state.queue.find((candidate) => candidate.state === 'pending')
      if (!op) break
      if ((await send(op)) === 'retry') {
        const current = state.queue.find((candidate) => candidate.opId === op.opId)
        flushTimer = setTimeout(flush, retryDelay(current?.attempts ?? 1))
        break
      }
    }
  } finally {
    flushing = false
  }
}

export type RecordResult = { ok: false; error: string } | { ok: true; outcome: SendOutcome }

/**
 * Saves a status change on the device and starts sending it. Resolves once the
 * server confirms it, or after a short wait with outcome 'pending' if the
 * connection is slow or down (it keeps retrying in the background).
 */
export async function recordStatusChange(
  student: User,
  action: StatusAction,
  additionalParams?: Record<string, unknown>,
  waitMs = 2_000
): Promise<RecordResult> {
  if (!state.ownerId) return { ok: false, error: 'Not signed in' }

  const transition = TRANSITIONS[action]
  const current = effectiveUser(student.id, student)!
  if (!transition.from.includes(current.currentStatus)) {
    return { ok: false, error: transitionError(current, action) }
  }

  const op: QueuedChange = {
    opId: crypto.randomUUID(),
    ownerId: state.ownerId,
    userId: student.id,
    userName: student.name,
    action,
    additionalParams,
    scannedAt: new Date().toISOString(),
    state: 'pending',
    attempts: 0,
  }

  try {
    await idb.put('queue', op)
  } catch (error) {
    console.error('Could not save the change on this device:', error)
  }
  if (!state.users.has(student.id)) {
    // Picked from a server search before the roster loaded; keep it so the change can be shown
    setState({ users: new Map(state.users).set(student.id, student) })
  }
  setState({ queue: [...state.queue, op] })

  const outcome = new Promise<SendOutcome>((resolve) => {
    waiters.set(op.opId, resolve)
    setTimeout(() => settle(op.opId, 'pending'), waitMs)
  })
  // A new scan is a good moment to try again even if a retry is scheduled
  clearTimeout(flushTimer)
  flush()
  return { ok: true, outcome: await outcome }
}

function transitionError(user: User, action: StatusAction) {
  if (action === 'reg-in' && user.currentStatus === 'gate-out') {
    return `${user.name} hasn't been gated in yet. If they just came through the main gate, wait for the gate's scan to sync.`
  }
  const label = TRANSITIONS[action].label
  return `${user.name} is currently ${user.currentStatus}, so ${label} isn't possible.`
}

/** Removes a rejected change the operator has dealt with */
export function dismissChange(opId: string) {
  dropOp(opId)
}

/** Sends a rejected change again, e.g. after the other desk has synced */
export function retryChange(opId: string) {
  const op = state.queue.find((candidate) => candidate.opId === opId)
  if (!op) return
  // Move it to the back so it doesn't jump ahead of newer scans for the same student
  setState({ queue: [...state.queue.filter((candidate) => candidate.opId !== opId), { ...op, state: 'pending', error: undefined }] })
  persist(idb.put('queue', { ...op, state: 'pending', error: undefined }))
  flush()
}

/** Tries everything now instead of waiting for the next retry */
export function syncNow() {
  scheduleSync(0)
  clearTimeout(flushTimer)
  flush()
}

// ---------------------------------------------------------------------------
// Lifecycle

function onOnline() {
  syncNow()
}

function onVisibilityChange() {
  if (!document.hidden) syncNow()
}

/** Loads the cached roster and queue for this account and starts syncing */
export async function start(ownerId: string) {
  if (state.ownerId === ownerId) {
    // Same account, e.g. after signing in again: pick up where it left off
    if (state.authExpired) setState({ authExpired: false })
    syncNow()
    return
  }

  stop()
  setState({ ...INITIAL_STATE, ownerId })
  window.addEventListener('online', onOnline)
  document.addEventListener('visibilitychange', onVisibilityChange)

  let users: User[] = []
  let queue: QueuedChange[] = []
  let meta: Meta | undefined
  try {
    ;[users, queue, meta] = await Promise.all([
      idb.getAll<User>('roster'),
      idb.getAll<QueuedChange>('queue'),
      idb.get<Meta>('meta', 'meta'),
    ])
  } catch (error) {
    console.error('Could not read offline data:', error)
  }
  if (state.ownerId !== ownerId) return

  // The cached roster belongs to whoever signed in last; another account starts clean
  const sameOwner = meta?.ownerId === ownerId
  if (!sameOwner) {
    users = []
    persist(idb.replaceAll('roster', []))
    persist(idb.put('meta', { ownerId, syncedAt: null, fullSyncedAt: null } satisfies Meta, 'meta'))
  }
  fullSyncedAt = sameOwner ? (meta?.fullSyncedAt ?? null) : null

  setState({
    ready: true,
    users: new Map(users.map((user) => [user.id, user])),
    syncedAt: sameOwner ? (meta?.syncedAt ?? null) : null,
    // Other accounts' changes stay on the device until that account signs in again
    queue: queue
      .filter((op) => op.ownerId === ownerId)
      .sort((a, b) => a.scannedAt.localeCompare(b.scannedAt)),
  })
  syncNow()
}

export function stop() {
  clearTimeout(syncTimer)
  clearTimeout(flushTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', onOnline)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}

/** Deletes everything stored on this device (roster and unsent changes) */
export async function clearOfflineData() {
  stop()
  setState(INITIAL_STATE)
  fullSyncedAt = null
  try {
    await idb.clearAll()
  } catch (error) {
    console.error('Could not clear offline data:', error)
  }
}
