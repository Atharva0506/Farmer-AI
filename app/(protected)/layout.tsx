import { AppShell } from "@/components/layout/app-shell"
import { auth } from "@/auth"

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    const userRole = session?.user?.role || "FARMER" // Default to FARMER if undefined

    return <AppShell userRole={userRole}>{children}</AppShell>
}
