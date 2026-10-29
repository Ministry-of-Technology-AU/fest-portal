import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { applyStatusChange } from '@/lib/status-change'
import type { SecurityStatus } from '@/lib/types'

// Which statuses each action can be applied from
const TRANSITIONS: Record<string, { from: SecurityStatus[]; to: SecurityStatus }> = {
  'gate-in': { from: ['gate-out'], to: 'gate-in' },
  'gate-out': { from: ['reg-out', 'gate-in'], to: 'gate-out' },
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

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    const transition = TRANSITIONS[action]
    if (!transition) {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      )
    }

    const result = await applyStatusChange({
      userId,
      // Fest users can only change their own users; admins can change anyone
      festId: session.user.role === 'admin' ? null : session.user.id,
      from: transition.from,
      to: transition.to,
      source: 'gate',
    })

    if (!result.ok) {
      return result.reason === 'not_found'
        ? NextResponse.json({ error: 'User not found' }, { status: 404 })
        : NextResponse.json(
            { error: `Cannot ${action} from current status: ${result.currentStatus}` },
            { status: 400 }
          )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}`,
      user: result.user
    })

  } catch (error) {
    console.error('Error updating gate status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
