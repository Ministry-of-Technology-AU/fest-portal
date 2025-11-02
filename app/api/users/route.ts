import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
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
      visitDates: user.visitDates.split(','), // Assuming comma-separated dates
      currentStatus: user.currentStatus.replace('_', '-'), // Convert snake_case to kebab-case
      lastStatusTime: user.lastStatusTime.toISOString(),
      statusTrail: user.status_trail.map((trail: any) => ({
        status: trail.status.replace('_', '-'),
        timestamp: trail.timestamp.toISOString(),
        source: trail.source
      }))
    }))

    return NextResponse.json(transformedUsers)
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