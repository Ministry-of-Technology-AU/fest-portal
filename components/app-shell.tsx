import type React from "react"
import { Navigation } from "@/components/navigation"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  /** "narrow" for single-task desk screens, "wide" for tables and dashboards */
  width?: "narrow" | "wide"
}

export function AppShell({ children, width = "wide" }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <Navigation />
      <main
        className={cn(
          "mx-auto w-full px-4 pt-6 pb-16 sm:px-6 sm:pt-10 lg:px-8",
          width === "narrow" ? "max-w-3xl" : "max-w-7xl",
        )}
      >
        {children}
      </main>
    </div>
  )
}
