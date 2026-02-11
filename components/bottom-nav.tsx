"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, ShoppingBag, FileText, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { useSession } from "next-auth/react"

const navItems = [
  { href: "/dashboard", icon: Home, labelKey: "home" }, // Placeholder, dynamic logic below
  { href: "/assistant", icon: MessageCircle, labelKey: "assistant" },
  { href: "/marketplace", icon: ShoppingBag, labelKey: "market" },
  { href: "/schemes", icon: FileText, labelKey: "schemes" },
  { href: "/dashboard/profile", icon: User, labelKey: "profile" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { data: session } = useSession()

  const role = session?.user?.role || "FARMER"
  const homeLink = role === "BUYER" ? "/dashboard/buyer" : "/dashboard/farmer"

  if (pathname === "/onboarding") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          let href = item.href
          if (item.labelKey === "home") {
            href = homeLink
          }

          const isActive = pathname === href
          return (
            <Link
              key={item.labelKey} // Changed key to labelKey since href changes
              href={href}
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
