import type React from "react"
import type { Metadata, Viewport } from "next"
import { Nunito, Nunito_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import Providers from "@/components/providers"
import "./globals.css"

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
})

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4f2" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
}

export const metadata: Metadata = {
  title: "Ashoka Fest Security Portal",
  description: "Gate-in and registration portal, by Techmin",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nunito.variable} ${nunitoSans.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
