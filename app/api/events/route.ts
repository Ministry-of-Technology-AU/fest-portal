import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Admins could potentially see all events or we could filter by festUserId if provided in query
    // For now, let's just return events related to the logged-in fest user
    const whereClause = session.user.role === 'admin' 
      ? {} 
      : { festId: session.user.id }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      events
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
}
