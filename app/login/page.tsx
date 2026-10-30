"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function LoginPage() {
  const [festCredentials, setFestCredentials] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState({ fest: false, admin: false })
  const router = useRouter()

  const handleFestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading({ ...loading, fest: true })

    try {
      const result = await signIn("fest-credentials", {
        username: festCredentials.username,
        password: festCredentials.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Login Failed", {
          description: "Invalid username or password"
        })
      } else {
        toast.success("Login Successful", {
          description: "Welcome to the fest portal!"
        })
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      toast.error("Login Error", {
        description: "An unexpected error occurred"
      })
    } finally {
      setLoading({ ...loading, fest: false })
    }
  }

  const handleGoogleLogin = async () => {
    setLoading({ ...loading, admin: true })
    
    try {
      const result = await signIn("google", {
        callbackUrl: "/admin",
        redirect: false,
      })

      if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      toast.error("Login Error", {
        description: "Failed to initiate Google login"
      })
      setLoading({ ...loading, admin: false })
    }
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel: full height on desktop, compact banner on mobile */}
      <aside className="relative overflow-hidden bg-primary px-6 py-8 text-primary-foreground sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:20px_20px]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <ShieldCheck className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-heading text-lg font-extrabold">Security Portal</p>
            <p className="text-xs opacity-75">by Techmin</p>
          </div>
        </div>
        <div className="relative mt-8 hidden max-w-md lg:block">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-secondary uppercase">Fest operations</p>
          <h1 className="font-heading text-5xl leading-[1.05] font-extrabold tracking-tight">
            Every entry,
            <br />
            accounted for.
          </h1>
          <p className="mt-4 text-base opacity-80">
            Gate-in, registration and attendee records for the fest desk team, in one place.
          </p>
        </div>
        <p className="relative mt-8 hidden text-xs opacity-60 lg:block">Engineered by the Ministry of Technology, Ashoka University</p>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm animate-rise">
          <div className="mb-8">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">Sign in</h2>
            <p className="mt-1 text-muted-foreground">Choose how you&apos;d like to sign in.</p>
          </div>

          <Tabs defaultValue="fest" className="w-full gap-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fest">Fest Staff</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="fest">
              <form onSubmit={handleFestLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    value={festCredentials.username}
                    onChange={(e) => setFestCredentials({ ...festCredentials, username: e.target.value })}
                    placeholder="Your assigned username"
                    required
                    className="h-11 bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={festCredentials.password}
                    onChange={(e) => setFestCredentials({ ...festCredentials, password: e.target.value })}
                    placeholder="Password"
                    required
                    className="h-11 bg-card"
                  />
                </div>
                <Button type="submit" size="xl" className="w-full" disabled={loading.fest}>
                  {loading.fest && <Loader2 className="animate-spin" />}
                  {loading.fest ? "Signing in..." : "Sign in as Fest Staff"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <div className="space-y-4">
                <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
                  Admin access is restricted to authorized Google accounts only.
                </p>
                <Button onClick={handleGoogleLogin} variant="outline" size="xl" className="w-full" disabled={loading.admin}>
                  {loading.admin ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {loading.admin ? "Connecting..." : "Continue with Google"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Fest staff use their assigned credentials. Admins use an authorized Google account.
          </p>
        </div>
      </main>
    </div>
  )
}
