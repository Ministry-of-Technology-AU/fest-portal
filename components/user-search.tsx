"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/status-pill"
import type { User } from "@/lib/types"

interface UserSearchProps {
  onSelectUser: (user: User) => void
  placeholder?: string
}

export function UserSearch({ onSelectUser, placeholder = "ID, name, email or phone" }: UserSearchProps) {
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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            inputMode="search"
            enterKeyHint="search"
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
            className="h-11 bg-card pl-9 text-base sm:text-sm"
          />
        </div>
        <Button onClick={search} disabled={loading} className="h-11 px-4 sm:px-5" aria-label="Search">
          {loading ? <Loader2 className="animate-spin" /> : <Search className="sm:hidden" />}
          <span className="hidden sm:inline">{loading ? "Searching" : "Search"}</span>
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Press Enter to search</p>
      {showResults && !loading && (
        <div className="absolute top-12 right-0 left-0 z-50 max-h-96 animate-in overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-xl fade-in-0 slide-in-from-top-1">
          {results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={() => {
                  onSelectUser(user)
                  setQuery("")
                  setResults([])
                  setShowResults(false)
                }}
                className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold">{user.name}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    <span className="font-mono">{user.id}</span> · {user.collegeName}
                  </div>
                </div>
                <StatusPill status={user.currentStatus} className="hidden xs:inline-flex" />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
          )}
        </div>
      )}
    </div>
  )
}
