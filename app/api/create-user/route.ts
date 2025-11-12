import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userData } = await request.json()

    // Validate required fields
    if (!userData.id || !userData.name || !userData.email || !userData.collegeName || !userData.phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, email, collegeName, phoneNumber' },
        { status: 400 }
      )
    }

    // For fest users, use their session ID. For admins, they need to specify which fest user
    let festUserId: string
    
    if (session.user.role === 'admin') {
      // Admins can create users for any fest, but need to specify which fest user
      const { festUserId: providedFestUserId } = userData
      if (!providedFestUserId) {
        return NextResponse.json(
          { error: 'Admin users must provide festUserId to create users' },
          { status: 400 }
        )
      }
      festUserId = providedFestUserId
    } else {
      // Fest users create users for themselves
      festUserId = session.user.id
    }

    // Verify that the fest user exists
    const festUser = await prisma.fest_user.findUnique({
      where: { id: festUserId }
    })

    if (!festUser) {
      return NextResponse.json(
        { error: 'Invalid fest user ID' },
        { status: 400 }
      )
    }

    // Check if user with this ID or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.id },
          { email: userData.email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.id === userData.id ? 'User ID already exists' : 'Email already exists' },
        { status: 409 }
      )
    }

    const now = new Date()

    // Prepare user data
    const createUserData = {
      id: userData.id,
      name: userData.name,
      collegeName: userData.collegeName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      visitDates: Array.isArray(userData.visitDates) 
        ? userData.visitDates.join(',') 
        : userData.visitDates || '',
      currentStatus: 'gate_out' as const,
      lastStatusTime: now,
      festId: festUserId
    }

    // Create user and initial status trail in a transaction
    const result = await prisma.$transaction([
      // Create user
      prisma.user.create({
        data: createUserData,
        include: {
          user_event: true,
          status_trail: {
            orderBy: {
              timestamp: 'desc'
            }
          }
        }
      }),
      // Create initial status trail entry
      prisma.status_trail.create({
        data: {
          userId: userData.id,
          status: 'gate_out' as const,
          timestamp: now,
          source: 'system' as const
        }
      })
    ])

    const newUser = result[0]

    // Create user events if provided
    if (userData.eventsRegistered && Array.isArray(userData.eventsRegistered)) {
      await Promise.all(
        userData.eventsRegistered.map((eventName: string, index: number) => 
          prisma.user_event.create({
            data: {
              userId: userData.id,
              eventId: index + 1,
              eventName: eventName,
              festId: festUserId
            }
          })
        )
      )
    }

    // Fetch the complete user data with events
    const completeUser = await prisma.user.findUnique({
      where: { id: userData.id },
      include: {
        user_event: true,
        status_trail: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    // Transform the data to match frontend interface
    const transformedUser = {
      id: completeUser!.id,
      name: completeUser!.name,
      collegeName: completeUser!.collegeName,
      email: completeUser!.email,
      phoneNumber: completeUser!.phoneNumber,
      eventsRegistered: completeUser!.user_event.map((event: any) => event.eventName),
      visitDates: completeUser!.visitDates ? completeUser!.visitDates.split(',') : [],
      currentStatus: completeUser!.currentStatus.replace('_', '-'),
      lastStatusTime: completeUser!.lastStatusTime.toISOString(),
      festId: completeUser!.festId,
      statusTrail: completeUser!.status_trail.map((trail: any) => ({
        status: trail.status.replace('_', '-'),
        timestamp: trail.timestamp.toISOString(),
        source: trail.source
      }))
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: transformedUser,
      festUser: {
        id: festUser.id,
        username: festUser.username,
        email: festUser.email
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'User ID or email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
