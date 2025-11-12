"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
          description: "Invalid username or password",
          style: {
            background: '#ef4444',
            color: 'white',
            border: '1px solid #dc2626'
          }
        })
      } else {
        toast.success("Login Successful", {
          description: "Welcome to the fest portal!",
          style: {
            background: '#10b981',
            color: 'white',
            border: '1px solid #059669'
          }
        })
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      toast.error("Login Error", {
        description: "An unexpected error occurred",
        style: {
          background: '#ef4444',
          color: 'white',
          border: '1px solid #dc2626'
        }
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
        description: "Failed to initiate Google login",
        style: {
          background: '#ef4444',
          color: 'white',
          border: '1px solid #dc2626'
        }
      })
      setLoading({ ...loading, admin: false })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">University Security Portal</h1>
          <p className="text-muted-foreground mt-2">Please sign in to continue</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Choose your login method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fest" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fest">Fest Staff</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value="fest" className="space-y-4">
                <form onSubmit={handleFestLogin} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <Input
                      type="text"
                      value={festCredentials.username}
                      onChange={(e) => setFestCredentials({ ...festCredentials, username: e.target.value })}
                      placeholder="Enter your username"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={festCredentials.password}
                      onChange={(e) => setFestCredentials({ ...festCredentials, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading.fest}
                  >
                    {loading.fest ? "Signing in..." : "Sign in as Fest Staff"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Admin access is restricted to authorized Google accounts only.
                  </p>
                  <Button 
                    onClick={handleGoogleLogin}
                    className="w-full"
                    disabled={loading.admin}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {loading.admin ? "Connecting..." : "Sign in with Google"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Fest staff: Use your assigned username and password</p>
          <p>Admins: Use your authorized Google account</p>
        </div>
      </div>
    </div>
  )
}