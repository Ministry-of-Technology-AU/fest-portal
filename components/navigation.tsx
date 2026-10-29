"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { signOutAndClear, useOperator } from "@/components/offline-provider"
import { getState as getOfflineState } from "@/lib/offline/engine"
import { LogOut, Menu, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { visibleNavLinks } from "@/lib/nav"
import { cn } from "@/lib/utils"

function Brand() {
  return (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-heading text-base font-extrabold text-primary dark:text-primary-extralight">
          Security Portal
        </span>
        <span className="truncate text-[11px] text-muted-foreground">by Techmin</span>
      </span>
    </Link>
  )
}

function initials(name: string | null | undefined) {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { session } = useOperator()
  const userRole = session?.user?.role
  const links = visibleNavLinks(userRole)

  const handleLogout = async () => {
    const unsent = getOfflineState().queue.length
    if (
      unsent > 0 &&
      !window.confirm(
        `${unsent} scan${unsent === 1 ? " hasn't" : "s haven't"} reached the server yet. Signing out deletes ${unsent === 1 ? "it" : "them"} from this device. Sign out anyway?`
      )
    ) {
      return
    }
    await signOutAndClear()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Brand />

        {/* Desktop links */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/8 hover:text-primary dark:hover:bg-white/5 dark:hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Desktop account menu */}
          <div className="hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account" className="rounded-full">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground ring-2 ring-background">
                    {initials(session?.user?.name)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-semibold">{session?.user?.name ?? "Signed in"}</p>
                  {session?.user?.email && (
                    <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                  )}
                  {userRole && (
                    <p className="mt-1 text-[11px] font-bold tracking-wider text-primary uppercase dark:text-primary-extralight">
                      {userRole}
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile drawer */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs gap-0 bg-sidebar p-0">
              <SheetHeader className="border-b border-sidebar-border p-4">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">Portal sections</SheetDescription>
                <Brand />
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                <p className="px-2 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  Tools
                </p>
                {links.map((link) => {
                  const active = isActive(link.href)
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-semibold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-primary-light/15",
                      )}
                    >
                      <Icon className={cn("size-5", active ? "text-primary-foreground" : "text-muted-foreground")} />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
              <div className="border-t border-sidebar-border p-3">
                {session?.user?.name && (
                  <div className="mb-2 flex items-center gap-3 px-2 py-1">
                    <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-secondary-foreground">
                      {initials(session.user.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{session.user.name}</p>
                      {userRole && <p className="text-xs text-muted-foreground capitalize">{userRole}</p>}
                    </div>
                  </div>
                )}
                <Button
                  onClick={async () => {
                    setIsOpen(false)
                    await handleLogout()
                  }}
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  size="lg"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
