"use client"

import { usePathname } from "next/navigation"
import { AppHeader } from "./app-header"
import { BottomNav } from "./bottom-nav"
import { SidebarNav } from "./sidebar-nav"
import { DesktopHeader } from "./desktop-header"
import { FloatingMicButton } from "./floating-mic-button"
import type { ReactNode } from "react"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isOnboarding = pathname === "/onboarding"
  const isLanding = pathname === "/"
  const isAuth = pathname?.startsWith("/auth")
  const isPublic = isOnboarding || isLanding || isAuth

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarNav />
      <div className="md:ml-64 lg:ml-72 flex flex-col min-h-screen">
        <AppHeader />
        <DesktopHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <FloatingMicButton />
    </div>
  )
}
