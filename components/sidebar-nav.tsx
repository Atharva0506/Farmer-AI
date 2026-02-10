"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  MessageCircle,
  ShoppingBag,
  FileText,
  User,
  Leaf,
  Camera,
  Package,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const mainNav = [
  { href: "/farmer", icon: Home, labelKey: "home" },
  { href: "/assistant", icon: MessageCircle, labelKey: "assistant" },
  { href: "/assistant", icon: Camera, labelKey: "diseaseCheck" },
  { href: "/marketplace", icon: ShoppingBag, labelKey: "market" },
  { href: "/post-produce", icon: Package, labelKey: "postProduce" },
  { href: "/schemes", icon: FileText, labelKey: "schemes" },
]

const dashboardNav = [
  { href: "/farmer", icon: User, labelKey: "dashboard" },
  { href: "/buyer", icon: Users, labelKey: "buyerDashboard" },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  if (pathname === "/onboarding") return null

  return (
    <aside
      className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-card h-screen fixed left-0 top-0 z-30"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Leaf size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">{t("appName")}</h1>
          <p className="text-xs text-muted-foreground">{t("appTagline")}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon size={20} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="my-4 border-t border-border" />

        <ul className="flex flex-col gap-1">
          {dashboardNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon size={20} />
                  <span>{t(item.labelKey)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
