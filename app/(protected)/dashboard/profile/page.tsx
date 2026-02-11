"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"

export default function ProfilePage() {
    const { data: session } = useSession()
    const { t } = useLanguage()

    return (
        <div className="p-6 max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{t("profile")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{session?.user?.phone || session?.user?.email || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p className="font-medium capitalize">{session?.user?.role?.toLowerCase() || "User"}</p>
                    </div>

                    <Button variant="destructive" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>
                        Sign Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
