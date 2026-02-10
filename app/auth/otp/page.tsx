"use client"

import { useState, Suspense, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useLanguage } from "@/lib/language-context"

function OTPInputContent() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const role = searchParams.get("role") || "farmer"
    const phone = searchParams.get("phone") || ""

    const [otp, setOtp] = useState("")
    const [timer, setTimer] = useState(30)

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length === 6) {
            // Mock verification
            router.push(role === "buyer" ? "/buyer" : "/farmer")
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col p-6">
            <div className="mb-8">
                <Link href={`/auth/phone?role=${role}`}>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold mt-4">{t("enterOTP")}</h1>
                <p className="text-muted-foreground mt-2">
                    {t("otpPlaceholder")} <br />
                    <span className="text-foreground font-medium">+91 {phone}</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col max-w-md mx-auto w-full items-center">
                <div className="space-y-8 w-full flex flex-col items-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full text-lg h-12"
                        disabled={otp.length !== 6}
                    >
                        {t("verifyOTP")}
                    </Button>

                    <div className="text-center">
                        {timer > 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t("resendOTP")} in 00:{timer < 10 ? `0${timer}` : timer}
                            </p>
                        ) : (
                            <Button
                                variant="link"
                                className="text-primary p-0 h-auto"
                                onClick={() => setTimer(30)}
                            >
                                {t("resendOTP")}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}

export default function OTPInputPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OTPInputContent />
        </Suspense>
    )
}
