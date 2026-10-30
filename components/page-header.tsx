import type React from "react"
import type { LucideIcon } from "lucide-react"

interface PageHeaderProps {
  title: string
  description?: React.ReactNode
  icon?: LucideIcon
  eyebrow?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, description, icon: Icon, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex animate-rise flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {Icon && (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-12">
            <Icon className="size-5 sm:size-6" />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-0.5 text-xs font-bold tracking-[0.14em] text-primary uppercase dark:text-primary-extralight">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
