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

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    // Build query based on user role
    const whereClause = session.user.role === 'admin' 
      ? { id: userId } // Admins can access any user
      : { id: userId, festId: session.user.id } // Fest users can only access their own users

    // Get current user status
    const user = await prisma.user.findUnique({
      where: whereClause
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let newStatus: string | null = null
    let isValidTransition = false

    if (action === 'reg-in') {
      // Can only reg-in if currently gate-in
      if (user.currentStatus === 'gate_in') {
        newStatus = 'reg_in'
        isValidTransition = true
      }
    } else if (action === 'reg-out') {
      // Can only reg-out if currently reg-in
      if (user.currentStatus === 'reg_in') {
        newStatus = 'reg_out'
        isValidTransition = true
      }
    }

    if (!isValidTransition || !newStatus) {
      return NextResponse.json(
        { error: `Cannot ${action} from current status: ${user.currentStatus.replace('_', '-')}` },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update user status and create trail entry in a transaction
    const result = await prisma.$transaction([
      // Update user status
      prisma.user.update({
        where: { id: userId },
        data: {
          currentStatus: newStatus as any,
          lastStatusTime: now
        }
      }),
      // Create trail entry
      prisma.status_trail.create({
        data: {
          userId,
          status: newStatus as any,
          timestamp: now,
          source: 'registration'
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}`,
      user: {
        ...result[0],
        currentStatus: result[0].currentStatus.replace('_', '-')
      }
    })

  } catch (error) {
    console.error('Error updating registration status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
