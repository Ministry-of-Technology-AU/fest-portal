"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import type { User } from "@/lib/types"

interface UserSearchProps {
  onSelectUser: (user: User) => void
  placeholder?: string
}

export function UserSearch({ onSelectUser, placeholder = "Search by ID, name, email or phone and press Enter..." }: UserSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    const q = query.trim()
    if (!q) return

    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.users ?? [])
      setShowResults(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") search()
  }

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!e.target.value) {
            setResults([])
            setShowResults(false)
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        className="border-border"
      />
      {loading && (
        <p className="absolute top-full left-0 mt-2 text-xs text-muted-foreground px-1">Searching...</p>
      )}
      {showResults && !loading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.length > 0 ? (
              results.map((user) => (
                <button
                  key={user.id}
                  onMouseDown={() => {
                    onSelectUser(user)
                    setQuery("")
                    setResults([])
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
