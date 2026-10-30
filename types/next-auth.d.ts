import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      provider: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string
    provider?: string
    /** fest_user.updatedAt at sign-in, to notice later password or role changes */
    accountVersion?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string
    provider?: string
    accountVersion?: number
    /** When the account was last re-checked (ms) */
    checkedAt?: number
  }
}