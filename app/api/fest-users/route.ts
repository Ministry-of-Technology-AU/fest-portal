import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getFestUsers, invalidateCache } from '@/lib/cache'

// Password accounts are desk logins. Admins sign in with Google and are checked
// against ADMIN_EMAILS, so this route must never hand out the admin role.
const ACCOUNT_ROLES = ['fest', 'staff']
const MIN_PASSWORD_LENGTH = 8

// proxy.ts also blocks non-admins from this route, but the route checks for
// itself so it stays safe if the proxy matcher ever changes
async function requireAdmin() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

function invalidAccountFields(password: unknown, role: unknown): string | null {
  if (password !== undefined && (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }
  if (role !== undefined && !ACCOUNT_ROLES.includes(role as string)) {
    return `Role must be one of: ${ACCOUNT_ROLES.join(', ')}`
  }
  return null
}

// GET - List all fest users (admin only)
export async function GET(request: NextRequest) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const festUsers = await getFestUsers()

    return NextResponse.json(festUsers)
  } catch (error) {
    console.error('Error fetching fest users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fest users' },
      { status: 500 }
    )
  }
}

// POST - Create new fest user (admin only)
export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { username, password, email, role = 'fest' } = await request.json()

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'Username, password, and email are required' },
        { status: 400 }
      )
    }

    const invalid = invalidAccountFields(password, role)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }

    // Check if username or email already exists
    const existingUser = await prisma.fest_user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email'
      return NextResponse.json(
        { error: `${field} already exists` },
        { status: 409 }
      )
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await prisma.fest_user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    invalidateCache('fest-users')

    return NextResponse.json({
      success: true,
      message: 'Fest user created successfully',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating fest user:', error)
    return NextResponse.json(
      { error: 'Failed to create fest user' },
      { status: 500 }
    )
  }
}

// PUT - Update fest user password (admin only)
export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { userId, password, role } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const invalid = invalidAccountFields(password || undefined, role || undefined)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }

    const updateData: any = {}
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }
    
    if (role) {
      updateData.role = role
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      )
    }

    updateData.updatedAt = new Date()

    const updatedUser = await prisma.fest_user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    invalidateCache('fest-users')

    return NextResponse.json({
      success: true,
      message: 'Fest user updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating fest user:', error)
    return NextResponse.json(
      { error: 'Failed to update fest user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete fest user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAdmin()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await prisma.fest_user.delete({
      where: { id: userId }
    })

    // Deleting a fest user cascades to its events
    invalidateCache('fest-users', 'events')

    return NextResponse.json({
      success: true,
      message: 'Fest user deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting fest user:', error)
    return NextResponse.json(
      { error: 'Failed to delete fest user' },
      { status: 500 }
    )
  }
}
