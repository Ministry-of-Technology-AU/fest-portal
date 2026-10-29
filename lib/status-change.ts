import { Prisma } from '@/lib/generated/prisma'
import prisma from '@/lib/prisma'
import type { SecurityStatus } from '@/lib/types'

type StatusSource = 'gate' | 'registration' | 'admin' | 'system'

interface StatusChange {
  userId: string
  /** Restrict to this fest's users; null for admins, who can change anyone */
  festId: string | null
  /** Statuses the user must currently be in for the change to apply */
  from: SecurityStatus[]
  to: SecurityStatus
  source: StatusSource
  /** Shallow-merged into the user's existing additionalParams */
  additionalParams?: Record<string, unknown>
  /**
   * Id the device gave this change. A retry of a change that already applied
   * (e.g. the response was lost on a bad connection) then succeeds instead of
   * failing the status check.
   */
  clientOpId?: string
  /** When the device recorded the scan; offline scans reach the server later */
  scannedAt?: Date
}

type StatusChangeResult =
  | { ok: true; replayed?: boolean; user: { id: string; currentStatus: SecurityStatus; lastStatusTime: Date } }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'invalid_transition'; currentStatus: SecurityStatus }

const OP_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SCAN_AGE_MS = 24 * 60 * 60 * 1000

/** Reads the optional offline-queue fields from a request body, dropping anything malformed */
export function parseClientOp(body: { opId?: unknown; scannedAt?: unknown }) {
  const clientOpId = typeof body.opId === 'string' && OP_ID_PATTERN.test(body.opId) ? body.opId : undefined

  let scannedAt: Date | undefined
  if (typeof body.scannedAt === 'string') {
    const time = new Date(body.scannedAt).getTime()
    const now = Date.now()
    // Device clocks can drift; keep the scan time within the last day and not in the future
    if (!isNaN(time)) scannedAt = new Date(Math.min(now, Math.max(now - MAX_SCAN_AGE_MS, time)))
  }

  return { clientOpId, scannedAt }
}

/**
 * Checks the current status, updates it and writes the trail entry in a single
 * statement (one database round trip). Because the status check is part of the
 * UPDATE's WHERE clause, two simultaneous scans of the same student can't both
 * succeed: the second one sees the new status and fails the check.
 */
export async function applyStatusChange(change: StatusChange): Promise<StatusChangeResult> {
  const { userId, festId, from, to, source, additionalParams, clientOpId, scannedAt } = change

  // lastStatusTime is always the server's time, because the incremental sync in
  // /api/users looks for changes by it. Only the trail entry gets the scan time.
  const rows = await prisma.$queryRaw<{ id: string; currentStatus: SecurityStatus; lastStatusTime: Date }[]>`
    WITH updated AS (
      UPDATE "user"
      SET "currentStatus" = ${to}::"user_currentStatus",
          "lastStatusTime" = now() AT TIME ZONE 'UTC'
          ${additionalParams
            ? Prisma.sql`, "additionalParams" = COALESCE("additionalParams", '{}'::jsonb) || ${JSON.stringify(additionalParams)}::jsonb`
            : Prisma.empty}
      WHERE id = ${userId}
        ${festId ? Prisma.sql`AND "festId" = ${festId}` : Prisma.empty}
        AND "currentStatus"::text = ANY(${from}::text[])
      RETURNING id, "currentStatus"::text AS "currentStatus", "lastStatusTime"
    ), trail AS (
      INSERT INTO status_trail ("userId", status, "timestamp", source, "clientOpId")
      SELECT id, ${to}::status_trail_status,
        ${scannedAt ? Prisma.sql`${scannedAt.toISOString()}::timestamptz AT TIME ZONE 'UTC'` : Prisma.sql`"lastStatusTime"`},
        ${source}::status_trail_source, ${clientOpId ?? null}::varchar
      FROM updated
    )
    SELECT * FROM updated
  `

  if (rows.length > 0) {
    return { ok: true, user: rows[0] }
  }

  // Only reached when the change didn't apply: find out why
  const [user, alreadyApplied] = await Promise.all([
    prisma.user.findFirst({
      where: festId ? { id: userId, festId } : { id: userId },
      select: { id: true, currentStatus: true, lastStatusTime: true },
    }),
    clientOpId
      ? prisma.status_trail.findUnique({ where: { clientOpId }, select: { userId: true } })
      : null,
  ])

  if (!user) {
    return { ok: false, reason: 'not_found' }
  }

  const currentStatus = user.currentStatus.replace('_', '-') as SecurityStatus

  if (alreadyApplied?.userId === user.id) {
    return { ok: true, replayed: true, user: { ...user, currentStatus } }
  }

  return { ok: false, reason: 'invalid_transition', currentStatus }
}
