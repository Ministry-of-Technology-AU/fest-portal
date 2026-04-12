import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendUserCreatedEmail } from '@/lib/mail'

// Generate a unique 6-character alphanumeric ID
async function generateUniqueId(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let attempts = 0
  while (attempts < 10) {
    let id = ''
    const bytes = randomBytes(6)
    for (let i = 0; i < 6; i++) {
      id += chars[bytes[i] % chars.length]
    }
    // Check if this ID already exists
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return id
    attempts++
  }
  throw new Error('Failed to generate unique ID after 10 attempts')
}

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

    // Validate required fields (collegeName is optional)
    if (!userData.name || !userData.email || !userData.phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phoneNumber' },
        { status: 400 }
      )
    }

    // Auto-generate ID if not provided
    if (!userData.id) {
      userData.id = await generateUniqueId()
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

    // Check if user with this ID already exists (globally) or email exists within this fest
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.id },
          { email: userData.email, festId: festUserId }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.id === userData.id ? 'User ID already exists' : 'Email already registered for this fest' },
        { status: 409 }
      )
    }

    const now = new Date()

    // Determine visit dates — auto-set for litfest
    let visitDates = ''
    if (userData.visitDates) {
      visitDates = Array.isArray(userData.visitDates)
        ? userData.visitDates.join(',')
        : userData.visitDates
    } else if (festUser.username.toLowerCase() === 'litfest') {
      visitDates = '13/02/2026,14/02/2026'
    }

    // Prepare user data
    const createUserData = {
      id: userData.id,
      name: userData.name,
      collegeName: userData.collegeName || 'NA',
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      visitDates,
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
          events: true,
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

    // Create or connect user events if provided
    if (userData.eventsRegistered && Array.isArray(userData.eventsRegistered)) {
      await prisma.user.update({
        where: { id: userData.id },
        data: {
          events: {
            connectOrCreate: userData.eventsRegistered.map((eventName: string) => ({
              where: {
                name_festId: {
                  name: eventName,
                  festId: festUserId
                }
              },
              create: {
                name: eventName,
                festId: festUserId
              }
            }))
          }
        }
      });
    }

    // Fetch the complete user data with events
    const completeUser = await prisma.user.findUnique({
      where: { id: userData.id },
      include: {
        events: true,
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
      eventsRegistered: completeUser!.events.map((event: any) => event.name),
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

    // Send welcome email with user ID (fire and forget)
    sendUserCreatedEmail(
      userData.email,
      userData.name,
      userData.id,
      festUser!.username
    )

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: transformedUser,
      festUser: {
        id: festUser!.id,
        username: festUser!.username,
        email: festUser!.email
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
  }
}
