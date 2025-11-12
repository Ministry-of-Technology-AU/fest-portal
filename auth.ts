import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { NextAuthConfig, User, Account, Profile } from "next-auth"
import type { JWT } from "next-auth/jwt"

// List of allowed admin email addresses
const ALLOWED_ADMIN_EMAILS = [
  "admin@ashoka.edu.in",
  "security@ashoka.edu.in",
  "vansh.bothra_ug25@ashoka.edu.in"
  // Add more admin emails as needed
]

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

          if (!festUser) {
            return null
          }

          // Verify password with bcrypt
          const isPasswordValid = await bcrypt.compare(
            password,
            festUser.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: festUser.id,
            name: festUser.username,
            email: festUser.email,
            role: festUser.role,
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Check if email is in allowed admin list
        if (!ALLOWED_ADMIN_EMAILS.includes(user.email!)) {
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
          token.role = (user as any).role || "fest"
          token.provider = "fest-credentials"
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