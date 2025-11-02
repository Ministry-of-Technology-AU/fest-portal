"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PasskeyPage() {
  const [passkey, setPasskey] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPasskey = process.env.NEXT_PUBLIC_PORTAL_PASSKEY || "admin123"

    if (passkey === correctPasskey) {
      localStorage.setItem("portalAuth", "true")
      router.push("/dashboard")
    } else {
      setError("Invalid passkey")
      setPasskey("")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-primary">Security Portal</CardTitle>
          <CardDescription>University Gate-In & Registration System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="passkey" className="text-sm font-medium">
                Enter Passkey
              </label>
              <Input
                id="passkey"
                type="password"
                placeholder="Enter passkey"
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value)
                  setError("")
                }}
                className="border-border"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Access Portal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
