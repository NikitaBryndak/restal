"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  className?: string
  children: React.ReactNode
  variant?: "default" | "button"
  onClick?: () => void
}

export function NavLink({
  href,
  className,
  children,
  variant = "default",
  onClick
}: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  if (variant === "button") {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "border rounded-md border-foreground/20 px-4 py-2 text-sm transition-colors",
          "bg-white/90 text-black hover:bg-accent hover:text-white hover:border-accent",
          className
        )}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "text-sm text-foreground/70 transition-colors",
        {
          "text-foreground": isActive,
        },
        "hover:text-accent",
        className
      )}
    >
      {children}
    </Link>
  )
}