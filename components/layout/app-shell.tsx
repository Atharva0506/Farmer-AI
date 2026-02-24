"use client"

import { usePathname } from "next/navigation"
import { AppHeader } from "./app-header"
import { BottomNav } from "./bottom-nav"
import { SidebarNav } from "./sidebar-nav"
import { DesktopHeader } from "./desktop-header"
import { ErrorBoundary } from "@/components/error-boundary"
import { FloatingChatWidget } from "@/components/features/assistant/floating-chat-widget"
import { useState } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AppShell({ children, userRole }: { children: ReactNode; userRole: string }) {
    const pathname = usePathname()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const isOnboarding = pathname === "/onboarding"
    const isLanding = pathname === "/"
    const isAuth = pathname?.startsWith("/auth")
    const isPublic = isOnboarding || isLanding || isAuth

    if (isPublic) {
        return <>{children}</>
    }

    return (
        <div className="min-h-screen bg-background">
            <SidebarNav
                userRole={userRole}
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300",
                    isSidebarCollapsed ? "md:ml-16 lg:ml-20" : "md:ml-64 lg:ml-72"
                )}
            >
                <AppHeader />
                <DesktopHeader />
                <main className="flex-1 pb-20 md:pb-0">
                    <ErrorBoundary>{children}</ErrorBoundary>
                </main>
            </div>
            <BottomNav />
            <FloatingChatWidget />
        </div>
    )
}
