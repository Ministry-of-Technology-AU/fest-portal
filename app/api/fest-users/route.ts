import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - List all fest users (admin only)
export async function GET(request: NextRequest) {
  try {
    const festUsers = await prisma.fest_user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password from response
      }
    })

    return NextResponse.json(festUsers)
  } catch (error) {
    console.error('Error fetching fest users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fest users' },
      { status: 500 }
    )
}

// POST - Create new fest user (admin only)
export async function POST(request: NextRequest) {
  try {
    const { username, password, email, role = 'fest' } = await request.json()

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'Username, password, and email are required' },
        { status: 400 }
      )
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

// PUT - Update fest user password (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { userId, password, role } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
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

// DELETE - Delete fest user (admin only)
export async function DELETE(request: NextRequest) {
  try {
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