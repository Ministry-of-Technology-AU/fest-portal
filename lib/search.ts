import Fuse from "fuse.js"
import type { User } from "./types"

export function createSearchIndex(users: User[]) {
  return new Fuse(users, {
    keys: ["id", "name"],
    threshold: 0.3,
    minMatchCharLength: 1,
  })
}

export function searchUsers(query: string, users: User[]) {
  if (!query.trim()) return users
  const fuse = createSearchIndex(users)
  return fuse.search(query).map((result) => result.item)
}
