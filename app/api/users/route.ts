import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

const SYNC_OVERLAP_MS = 10_000

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Taken before querying, so the next `since` can't skip a change that
    // commits while this request is running
    const syncedAt = new Date()

    // Build query based on user role
    const whereClause: Record<string, unknown> = session.user.role === 'admin'
      ? {} // Admins can see all users
      : { festId: session.user.id } // Fest users can only see their own users

    // ?since=<syncedAt from a previous response> returns only users whose status
    // changed (or who were created) after it. The overlap absorbs clock skew and
    // timestamp(0) rounding; the client merges by id, so repeats are harmless.
    const since = new Date(request.nextUrl.searchParams.get('since') ?? '')
    if (!isNaN(since.getTime())) {
      whereClause.lastStatusTime = { gte: new Date(since.getTime() - SYNC_OVERLAP_MS) }
    }

    // ?trail=0 skips the status history, which the offline roster on the desk
    // devices doesn't show; it's most of the payload
    const withTrail = request.nextUrl.searchParams.get('trail') !== '0'

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        events: true,
        status_trail: withTrail && {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    // Transform the data to match our frontend interface
    const transformedUsers = users.map((user: any) => {
      // Collect dates from events
      const eventDates = user.events
        .filter((e: any) => e.visitDates)
        .flatMap((e: any) => e.visitDates.split(','))
        .map((d: string) => d.trim())
        .filter(Boolean);
      
      const uniqueVisitDates = Array.from(new Set(eventDates));

      return {
        id: user.id,
        name: user.name,
        collegeName: user.collegeName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        eventsRegistered: user.events.map((event: any) => event.name),
        visitDates: uniqueVisitDates,
        currentStatus: user.currentStatus.replace('_', '-'), // Convert snake_case to kebab-case
        lastStatusTime: user.lastStatusTime.toISOString(),
        festId: user.festId,
        additionalParams: user.additionalParams ?? undefined,
        statusTrail: (user.status_trail ?? []).map((trail: any) => ({
          status: trail.status.replace('_', '-'),
          timestamp: trail.timestamp.toISOString(),
          source: trail.source
        }))
      };
    })

    return NextResponse.json({
      users: transformedUsers,
      syncedAt: syncedAt.toISOString(),
      totalCount: transformedUsers.length,
      currentUser: {
        id: session.user.id,
        role: session.user.role,
        name: session.user.name,
        email: session.user.email
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
