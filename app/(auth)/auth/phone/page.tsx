"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/language-context"

function PhoneInputContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const role = searchParams.get("role") || "farmer"

    const [phone, setPhone] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phone.length === 10) {
            setIsLoading(true)
            try {
                const res = await fetch("/api/auth/otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone }),
                })

                if (res.ok) {
                    router.push(`/auth/otp?role=${role}&phone=${phone}`)
                } else {
                    // Handle error (show toast or alert)
                    alert("Failed to send OTP")
                }
            } catch (error) {
                console.error(error)
                alert("Something went wrong")
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col p-6">
            <div className="mb-8">
                <Link href="/auth/role">
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold mt-4">{t("enterPhone")}</h1>
                <p className="text-muted-foreground mt-2">{t("onboardingDesc1")}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col max-w-md mx-auto w-full">
                <div className="space-y-4">
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="tel"
                            placeholder={t("phonePlaceholder")}
                            className="pl-10 h-12 text-lg"
                            value={phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "")
                                if (val.length <= 10) setPhone(val)
                            }}
                            required
                        />
                    </div>
                    {/* Error message display if needed */}

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg h-12"
                        disabled={phone.length !== 10 || isLoading}
                    >
                        {isLoading ? "Sending..." : t("next")}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default function PhoneInputPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PhoneInputContent />
        </Suspense>
    )
}
