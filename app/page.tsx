"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldCheck } from "lucide-react"

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
    <div className="flex min-h-dvh items-center justify-center bg-background bg-dots p-4">
      <div className="w-full max-w-sm animate-rise rounded-2xl border bg-card p-6 shadow-xl sm:p-8">
        <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Security Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">University Gate-In &amp; Registration System</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="passkey" className="text-sm font-semibold">
              Passkey
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
              className="h-11"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="xl" className="w-full">
            Access Portal
          </Button>
        </form>
      </div>
    </div>
  )
}
