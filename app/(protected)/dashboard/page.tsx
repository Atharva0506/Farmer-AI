
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/auth/phone")
    }

    if (session.user.role === "BUYER") {
        redirect("/dashboard/buyer")
    }

    // Default to farmer
    redirect("/dashboard/farmer")
}
