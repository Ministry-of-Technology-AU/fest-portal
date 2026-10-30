import { useState, useEffect, useRef, useCallback } from 'react'
import { User } from './types'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Server time of the last successful fetch; changes are requested from here on
  const syncedAt = useRef<string | null>(null)

  // Full reload: picks up everything, including profile edits and deletions
  const fetchUsers = useCallback(async () => {
    try {
      // Only the first load shows the loading state; reloads keep the current list on screen
      if (!syncedAt.current) setLoading(true)
      const response = await fetch('/api/users')

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      // Handle the new response format with users array and metadata
      setUsers(data.users || data) // Support both old and new formats
      syncedAt.current = data.syncedAt ?? null
      setError(null)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cheap refresh: only users whose status changed (or who were created) since
  // the last fetch, merged into the current list. Doesn't see profile edits or
  // deletions, so pair it with an occasional fetchUsers().
  const syncChanges = useCallback(async () => {
    if (!syncedAt.current) return fetchUsers()

    try {
      const response = await fetch(`/api/users?since=${encodeURIComponent(syncedAt.current)}`)
      if (!response.ok) throw new Error('Failed to sync users')

      const data = await response.json()
      syncedAt.current = data.syncedAt
      const changed: User[] = data.users ?? []
      if (changed.length === 0) return

      setUsers((prev) => {
        const byId = new Map(prev.map((user) => [user.id, user]))
        for (const user of changed) byId.set(user.id, user)
        return Array.from(byId.values())
      })
    } catch (err) {
      // Keep showing the current list; the next sync retries from the same point
      console.error('Error syncing users:', err)
    }
  }, [fetchUsers])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    syncChanges
  }
}

export async function updateGateStatus(userId: string, action: 'gate-in' | 'gate-out') {
  const response = await fetch('/api/gate-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, action }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update status')
  }

  return response.json()
}

export async function updateRegistrationStatus(userId: string, action: 'reg-in' | 'reg-out', additionalParams?: Record<string, unknown>) {
  const response = await fetch('/api/registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, action, additionalParams }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update status')
  }

  return response.json()
}

export async function updateUser(userId: string, userData: Partial<User>) {
  const response = await fetch('/api/update-user', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, userData }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update user')
  }

  return response.json()
}

export async function createUser(userData: Omit<User, 'currentStatus' | 'lastStatusTime' | 'statusTrail'>) {
  const response = await fetch('/api/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userData }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create user')
  }

  return response.json()
}