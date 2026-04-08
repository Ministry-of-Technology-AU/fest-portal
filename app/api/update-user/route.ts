import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { sendUserUpdatedEmail } from '@/lib/mail'

export async function PUT(request: NextRequest) {
  try {
    // Get the session
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId, userData } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build query based on user role
    const whereClause = session.user.role === 'admin'
      ? { id: userId } // Admins can access any user
      : { id: userId, festId: session.user.id } // Fest users can only access their own users

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: whereClause
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (userData.name !== undefined) updateData.name = userData.name
    if (userData.collegeName !== undefined) updateData.collegeName = userData.collegeName
    if (userData.email !== undefined) updateData.email = userData.email
    if (userData.phoneNumber !== undefined) updateData.phoneNumber = userData.phoneNumber
    if (userData.additionalParams !== undefined) updateData.additionalParams = userData.additionalParams
    if (userData.visitDates !== undefined) {
      updateData.visitDates = Array.isArray(userData.visitDates)
        ? userData.visitDates.join(',')
        : userData.visitDates
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        events: true,
        status_trail: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    // Update events if provided
    if (userData.eventsRegistered && Array.isArray(userData.eventsRegistered)) {
      // First disconnect all existing events
      await prisma.user.update({
        where: { id: userId },
        data: {
          events: {
            set: [] // Clear existing connections
          }
        }
      })

      // Then connect/create the new list
      await prisma.user.update({
        where: { id: userId },
        data: {
          events: {
            connectOrCreate: userData.eventsRegistered.map((eventName: string) => ({
              where: {
                name_festId: {
                  name: eventName,
                  festId: updatedUser.festId
                }
              },
              create: {
                name: eventName,
                festId: updatedUser.festId
              }
            }))
          }
        }
      })
    }

    // Fetch the final user with updated events for the response
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        events: true,
        status_trail: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    if (!finalUser) throw new Error('User not found after update')

    // Transform the data to match frontend interface
    const transformedUser = {
      id: finalUser.id,
      name: finalUser.name,
      collegeName: finalUser.collegeName,
      email: finalUser.email,
      phoneNumber: finalUser.phoneNumber,
      eventsRegistered: finalUser.events.map((event: any) => event.name),
      visitDates: finalUser.visitDates.split(','),
      currentStatus: finalUser.currentStatus.replace('_', '-'),
      lastStatusTime: finalUser.lastStatusTime.toISOString(),
      statusTrail: finalUser.status_trail.map((trail: any) => ({
        status: trail.status.replace('_', '-'),
        timestamp: trail.timestamp.toISOString(),
        source: trail.source
      }))
    }

    // Send email notification with user ID (fire and forget)
    sendUserUpdatedEmail(
      finalUser.email,
      finalUser.name,
      finalUser.id,
      // Get fest name for email
      (await prisma.fest_user.findUnique({ where: { id: finalUser.festId } }))?.username || 'the fest'
    )

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: transformedUser
    })

  } catch (error) {
    console.error('Error updating user:', error)

    // Handle unique constraint violations (e.g., duplicate email)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
