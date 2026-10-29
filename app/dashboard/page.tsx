"use client"

import Link from "next/link"
import { useOperator } from "@/components/offline-provider"
import { ArrowUpRight } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { PageHeader } from "@/components/page-header"
import { visibleNavLinks, type NavLink } from "@/lib/nav"
import { cn } from "@/lib/utils"

function DeskCard({ link, tone, index }: { link: NavLink; tone: "primary" | "secondary"; index: number }) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      style={{ animationDelay: `${80 + index * 60}ms` }}
      className={cn(
        "group relative flex min-h-44 animate-rise flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-h-52 sm:p-7",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground dark:bg-secondary-extradark/20 dark:text-secondary-light",
      )}
    >
      {/* Oversized icon as a watermark */}
      <Icon
        aria-hidden
        className="pointer-events-none absolute -right-6 -bottom-8 size-40 opacity-[0.12] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 sm:size-48"
      />
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            tone === "primary" ? "bg-white/15" : "bg-black/5 dark:bg-white/10",
          )}
        >
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-5 opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>
      <div className="relative">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{link.label}</h2>
        <p className="mt-1 max-w-xs text-sm opacity-80 sm:text-base">{link.description}</p>
      </div>
    </Link>
  )
}

function ToolCard({ link, index }: { link: NavLink; index: number }) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      style={{ animationDelay: `${220 + index * 60}ms` }}
      className="group flex animate-rise items-center gap-4 rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(60,20,10,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-primary/25 dark:text-primary-extralight">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold">{link.label}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{link.description}</p>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
    </Link>
  )
}

export default function DashboardPage() {
  const { session } = useOperator()
  const links = visibleNavLinks(session?.user?.role).filter((link) => link.href !== "/dashboard")
  const deskLinks = links.filter((link) => link.desk)
  const toolLinks = links.filter((link) => !link.desk)
  const name = session?.user?.name

  return (
    <AppShell>
      <PageHeader
        eyebrow="Fest operations"
        title={name ? `Welcome, ${name}` : "Welcome to Security Portal"}
        description="Manage gate-in, registration, and user information."
      />

      <section aria-labelledby="desk-heading">
        <h2 id="desk-heading" className="sr-only">Desk tools</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {deskLinks.map((link, index) => (
            <DeskCard key={link.href} link={link} index={index} tone={index === 0 ? "primary" : "secondary"} />
          ))}
        </div>
      </section>

      <section aria-labelledby="tools-heading" className="mt-8 sm:mt-10">
        <h2 id="tools-heading" className="mb-3 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Management
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {toolLinks.map((link, index) => (
            <ToolCard key={link.href} link={link} index={index} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
