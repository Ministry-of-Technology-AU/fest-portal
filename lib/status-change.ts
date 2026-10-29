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
}

type StatusChangeResult =
  | { ok: true; user: { id: string; currentStatus: SecurityStatus; lastStatusTime: Date } }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'invalid_transition'; currentStatus: SecurityStatus }

/**
 * Checks the current status, updates it and writes the trail entry in a single
 * statement (one database round trip). Because the status check is part of the
 * UPDATE's WHERE clause, two simultaneous scans of the same student can't both
 * succeed: the second one sees the new status and fails the check.
 */
export async function applyStatusChange(change: StatusChange): Promise<StatusChangeResult> {
  const { userId, festId, from, to, source, additionalParams } = change

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
      INSERT INTO status_trail ("userId", status, "timestamp", source)
      SELECT id, ${to}::status_trail_status, "lastStatusTime", ${source}::status_trail_source
      FROM updated
    )
    SELECT * FROM updated
  `

  if (rows.length > 0) {
    return { ok: true, user: rows[0] }
  }

  // Only reached when the change didn't apply: find out why for the error message
  const user = await prisma.user.findFirst({
    where: festId ? { id: userId, festId } : { id: userId },
    select: { currentStatus: true },
  })

  if (!user) {
    return { ok: false, reason: 'not_found' }
  }

  return {
    ok: false,
    reason: 'invalid_transition',
    currentStatus: user.currentStatus.replace('_', '-') as SecurityStatus,
  }
}
