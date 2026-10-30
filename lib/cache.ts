import { unstable_cache, revalidateTag } from 'next/cache'
import prisma from '@/lib/prisma'

// Cached reads for data that rarely changes. Every API route that writes this
// data calls invalidateCache(), which expires it immediately, so reads stay
// accurate. The 10-minute revalidate is only a backstop for writes made outside
// the API (e.g. the scripts in lib/), which can't invalidate the cache.

type CacheTag = 'events' | 'fest-users'

const BACKSTOP_SECONDS = 600

/** Events for one fest, or all events when festId is null (admins) */
export const getEvents = unstable_cache(
  async (festId: string | null) =>
    prisma.event.findMany({
      where: festId ? { festId } : {},
      orderBy: { name: 'asc' },
    }),
  ['events'],
  { tags: ['events'], revalidate: BACKSTOP_SECONDS }
)

/** All portal accounts, without password hashes */
export const getFestUsers = unstable_cache(
  async () =>
    prisma.fest_user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ['fest-users'],
  { tags: ['fest-users'], revalidate: BACKSTOP_SECONDS }
)

/** Expire a cache immediately (not stale-while-revalidate), so the next read hits the DB */
export function invalidateCache(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 })
}
