import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const { userId, userData } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
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
      id: updatedUser.id,
      name: updatedUser.name,
      collegeName: updatedUser.collegeName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      eventsRegistered: updatedUser.user_event.map((event: any) => event.eventName),
      visitDates: updatedUser.visitDates.split(','),
      currentStatus: updatedUser.currentStatus.replace('_', '-'),
      lastStatusTime: updatedUser.lastStatusTime.toISOString(),
      statusTrail: updatedUser.status_trail.map((trail: any) => ({
        status: trail.status.replace('_', '-'),
        timestamp: trail.timestamp.toISOString(),
        source: trail.source
      }))
    }

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
