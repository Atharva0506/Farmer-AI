"use client"

import Link from "next/link"
import { Sprout, ShoppingBag, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

export default function RoleSelectionPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-background flex flex-col p-6">
            <div className="mb-8">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold mt-4">{t("selectRole")}</h1>
            </div>

            <div className="flex-1 flex flex-col gap-4 max-w-md mx-auto w-full justify-center -mt-20">
                <Link href="/auth/phone?role=farmer" className="group">
                    <Card className="border-2 border-border hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Sprout className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold">{t("farmer")}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{t("farmerDesc")}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/auth/phone?role=buyer" className="group">
                    <Card className="border-2 border-border hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                                <ShoppingBag className="h-8 w-8 text-accent" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold">{t("buyer")}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{t("buyerDesc")}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
