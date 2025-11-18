"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      refetchInterval={5*60}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}