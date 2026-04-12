import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

    if (!q) {
      return NextResponse.json({ users: [] })
    }

    const whereClause = {
      ...(session.user.role === 'admin' ? {} : { festId: session.user.id }),
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { id: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
        { phoneNumber: { contains: q } },
      ],
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: 10,
      include: {
        events: true,
        status_trail: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    const transformed = users.map((user: any) => {
      const eventDates = user.events
        .filter((e: any) => e.visitDates)
        .flatMap((e: any) => e.visitDates.split(','))
        .map((d: string) => d.trim())
        .filter(Boolean)
      const uniqueVisitDates = Array.from(new Set(eventDates))

      return {
        id: user.id,
        name: user.name,
        collegeName: user.collegeName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        eventsRegistered: user.events.map((e: any) => e.name),
        visitDates: uniqueVisitDates,
        currentStatus: user.currentStatus.replace('_', '-'),
        lastStatusTime: user.lastStatusTime.toISOString(),
        festId: user.festId,
        additionalParams: user.additionalParams ?? undefined,
        statusTrail: user.status_trail.map((t: any) => ({
          status: t.status.replace('_', '-'),
          timestamp: t.timestamp.toISOString(),
          source: t.source,
        })),
      }
    })

    return NextResponse.json({ users: transformed })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
