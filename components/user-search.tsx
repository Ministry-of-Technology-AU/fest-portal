"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { User } from "@/lib/types"
import { searchUsers } from "@/lib/search"

interface UserSearchProps {
  users: User[]
  onSelectUser: (user: User) => void
  placeholder?: string
}

export function UserSearch({ users, onSelectUser, placeholder = "Search by ID or Name..." }: UserSearchProps) {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  const results = useMemo(() => {
    return searchUsers(query, users)
  }, [query, users])

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowResults(true)
        }}
        onFocus={() => setShowResults(true)}
        className="border-border"
      />
      {showResults && query && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.length > 0 ? (
              results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user)
                    setQuery("")
                    setShowResults(false)
                  }}
                  className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0 transition"
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {user.id} • {user.collegeName}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-muted-foreground">No users found</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
