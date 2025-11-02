import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    // Get current user status
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let newStatus: string | null = null
    let isValidTransition = false

    if (action === 'gate-in') {
      // Can only gate-in if currently gate-out
      if (user.currentStatus === 'gate_out') {
        newStatus = 'gate_in'
        isValidTransition = true
      }
    } else if (action === 'gate-out') {
      // Can only gate-out if currently reg-out
      if (user.currentStatus === 'reg_out' || user.currentStatus === 'gate_in') {
        newStatus = 'gate_out'
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
          source: 'gate'
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
    console.error('Error updating gate status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}