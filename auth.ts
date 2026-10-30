import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { NextAuthConfig, User, Account, Profile } from "next-auth"
import type { JWT } from "next-auth/jwt"

// Allowed admin email addresses, from ADMIN_EMAILS (comma-separated)
const ALLOWED_ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

// bcrypt hash of a random throwaway password. Unknown usernames are checked
// against it so they take as long to reject as a wrong password, which stops
// account names being discovered by timing the login.
const DUMMY_PASSWORD_HASH = "$2b$12$5CKfwvsVLFW0uic33v4eiOg5x8.1Vv4s12SoHvnhFKkRlQwE54mjO"

// How often a password session is re-checked against its account, so deleting
// an account or changing its password or role signs out existing sessions
const ACCOUNT_RECHECK_MS = 5 * 60 * 1000

// The jwt callback runs on every authenticated request (proxy and route), but
// its token is only rewritten when the client refreshes its session. This keeps
// each server instance from looking the same account up on every request.
const accountCache = new Map<string, { role: string; version: number; fetchedAt: number }>()
const ACCOUNT_CACHE_MS = 60 * 1000

async function lookUpAccount(id: string) {
  const cached = accountCache.get(id)
  if (cached && Date.now() - cached.fetchedAt < ACCOUNT_CACHE_MS) return cached

  const account = await prisma.fest_user.findUnique({
    where: { id },
    select: { role: true, updatedAt: true },
  })
  if (!account) {
    accountCache.delete(id)
    return null
  }
  const entry = { role: account.role, version: account.updatedAt.getTime(), fetchedAt: Date.now() }
  accountCache.set(id, entry)
  return entry
}

/** Password accounts are desk logins; admin access only comes through Google + ADMIN_EMAILS */
function deskRole(role: string) {
  return role === "admin" ? "fest" : role
}

const config: NextAuthConfig = {
  providers: [
    // Google provider for admin users
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Credentials provider for fest users
    Credentials({
      id: "fest-credentials",
      name: "Fest Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const username = credentials.username as string
        const password = credentials.password as string

        try {
          const festUser = await prisma.fest_user.findUnique({
            where: { username }
          })

          // Verify password with bcrypt (against a dummy hash if there's no such user)
          const isPasswordValid = await bcrypt.compare(
            password,
            festUser?.password ?? DUMMY_PASSWORD_HASH
          )

          if (!festUser) {
            return null
          }

          if (!isPasswordValid) {
            return null
          }

          return {
            id: festUser.id,
            name: festUser.username,
            email: festUser.email,
            role: deskRole(festUser.role),
            accountVersion: festUser.updatedAt.getTime(),
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Only a Google-verified address on the admin list can sign in
        if (!profile?.email_verified) {
          return false
        }
        if (!user.email || !ALLOWED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          return false
        }
        // No need to store admin users in database - just verify email is allowed
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          token.role = "admin"
          token.provider = "google"
        } else if (account?.provider === "fest-credentials") {
          token.role = user.role || "fest"
          token.provider = "fest-credentials"
          token.accountVersion = user.accountVersion
          token.checkedAt = Date.now()
        }
        return token
      }

      // Returning null ends the session

      if (token.provider === "google") {
        // Taking an address off ADMIN_EMAILS (and redeploying) signs that admin out
        return token.email && ALLOWED_ADMIN_EMAILS.includes(token.email.toLowerCase()) ? token : null
      }

      if (token.provider === "fest-credentials" && token.sub) {
        if (token.checkedAt && Date.now() - token.checkedAt < ACCOUNT_RECHECK_MS) return token
        try {
          const current = await lookUpAccount(token.sub)
          if (!current) return null // account deleted
          // Any change to the account (password or role) since sign-in
          if (token.accountVersion !== undefined && token.accountVersion !== current.version) return null
          return { ...token, role: deskRole(current.role), accountVersion: current.version, checkedAt: Date.now() }
        } catch (error) {
          // Database unreachable: keep the session and check again on the next request
          console.error("Account re-check failed:", error)
          return token
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.provider = token.provider as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(config)