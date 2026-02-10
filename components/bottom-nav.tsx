"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, ShoppingBag, FileText, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const navItems = [
  { href: "/farmer", icon: Home, labelKey: "home" },
  { href: "/assistant", icon: MessageCircle, labelKey: "assistant" },
  { href: "/marketplace", icon: ShoppingBag, labelKey: "market" },
  { href: "/schemes", icon: FileText, labelKey: "schemes" },
  { href: "/farmer", icon: User, labelKey: "profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  if (pathname === "/onboarding") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors rounded-lg min-w-[56px]",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
