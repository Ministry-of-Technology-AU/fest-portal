import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getEvents } from '@/lib/cache'

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
    const events = await getEvents(session.user.role === 'admin' ? null : session.user.id)

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
}
