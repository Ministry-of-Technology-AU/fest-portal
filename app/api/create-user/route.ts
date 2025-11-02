import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userData } = await request.json()

    // Validate required fields
    if (!userData.id || !userData.name || !userData.email || !userData.collegeName || !userData.phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: id, name, email, collegeName, phoneNumber' },
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
      currentStatus: 'gate_out',
      lastStatusTime: now
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
          status: 'gate_out',
          timestamp: now,
          source: 'system'
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
              eventName: eventName
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
      statusTrail: completeUser!.status_trail.map((trail: any) => ({
        status: trail.status.replace('_', '-'),
        timestamp: trail.timestamp.toISOString(),
        source: trail.source
      }))
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: transformedUser
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
