"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="fest-portal-theme" disableTransitionOnChange>
      <SessionProvider
        refetchInterval={5*60}
        refetchOnWindowFocus={false}
      >
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}
