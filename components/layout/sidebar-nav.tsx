"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    MessageCircle,
    ShoppingBag,
    FileText,
    Leaf,
    Package,
    ChevronLeft,
    ChevronRight,
    Menu,
    LayoutDashboard,
    Sprout
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"

interface SidebarNavProps {
    userRole: string
    isCollapsed: boolean
    toggleSidebar: () => void
}

export function SidebarNav({ userRole, isCollapsed, toggleSidebar }: SidebarNavProps) {
    const pathname = usePathname()
    const { t } = useLanguage()

    if (pathname === "/onboarding") return null

    // Define navigation items based on role
    const navItems = userRole === "BUYER"
        ? [
            { href: "/dashboard/buyer", icon: LayoutDashboard, labelKey: "dashboard" },
            { href: "/marketplace", icon: ShoppingBag, labelKey: "market" },
        ]
        : [
            { href: "/dashboard/farmer", icon: Home, labelKey: "home" },
            { href: "/assistant", icon: MessageCircle, labelKey: "assistant" },
            { href: "/marketplace", icon: ShoppingBag, labelKey: "market" },
            { href: "/post-produce", icon: Package, labelKey: "postProduce" },
            { href: "/schemes", icon: FileText, labelKey: "schemes" },
        ]

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col border-r border-border bg-card h-screen fixed left-0 top-0 z-30 transition-all duration-300",
                isCollapsed ? "w-16 lg:w-20" : "w-64 lg:w-72"
            )}
            role="navigation"
            aria-label="Sidebar navigation"
        >
            <div className={cn(
                "flex items-center gap-2 border-b border-border transition-all",
                isCollapsed ? "px-0 justify-center py-5" : "px-6 py-5"
            )}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <Leaf size={20} className="text-primary-foreground" />
                </div>
                {!isCollapsed && (
                    <div className="animate-in fade-in zoom-in duration-300 overflow-hidden whitespace-nowrap">
                        <h1 className="text-base font-bold text-foreground leading-tight">{t("appName")}</h1>
                        <p className="text-xs text-muted-foreground">{t("appTagline")}</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
                <ul className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground font-medium"
                                            : "text-foreground hover:bg-muted",
                                        isCollapsed && "justify-center px-0"
                                    )}
                                    title={isCollapsed ? t(item.labelKey) : undefined}
                                >
                                    <item.icon size={20} className="shrink-0" />
                                    {!isCollapsed && (
                                        <span className="animate-in fade-in slide-in-from-left-2 duration-200">
                                            {t(item.labelKey)}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="p-3 border-t border-border mt-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center hover:bg-muted"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft size={18} />
                            <span className="text-sm">{t("collapse")}</span>
                        </div>
                    )}
                </Button>
            </div>
        </aside>
    )
}
