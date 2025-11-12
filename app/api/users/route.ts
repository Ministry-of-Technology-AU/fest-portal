import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

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

    // Build query based on user role
    const whereClause = session.user.role === 'admin' 
      ? {} // Admins can see all users
      : { festId: session.user.id } // Fest users can only see their own users

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        user_event: true,
        status_trail: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    // Transform the data to match our frontend interface
    const transformedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      collegeName: user.collegeName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      eventsRegistered: user.user_event.map((event: any) => event.eventName),
      visitDates: user.visitDates ? user.visitDates.split(',') : [], // Handle null visitDates
      currentStatus: user.currentStatus.replace('_', '-'), // Convert snake_case to kebab-case
      lastStatusTime: user.lastStatusTime.toISOString(),
      festId: user.festId,
      statusTrail: user.status_trail.map((trail: any) => ({
        status: trail.status.replace('_', '-'),
        timestamp: trail.timestamp.toISOString(),
        source: trail.source
      }))
    }))

    return NextResponse.json({
      users: transformedUsers,
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
  } finally {
    await prisma.$disconnect()
  }
}