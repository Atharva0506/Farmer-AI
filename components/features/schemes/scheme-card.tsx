"use client"

import { FileCheck, ExternalLink, Bookmark, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

interface SchemeCardProps {
    title: string
    description: string
    eligibility: string
    benefit: string
    deadline?: string
    matchScore?: number
}

export function SchemeCard({
    title,
    description,
    eligibility,
    benefit,
    deadline,
    matchScore,
}: SchemeCardProps) {
    const { t } = useLanguage()

    return (
        <Card className="border border-border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <FileCheck size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-foreground text-base leading-snug">{title}</h3>
                            {matchScore && (
                                <span className="shrink-0 inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-bold">
                                    {matchScore}%
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                        <div className="mt-3 flex flex-col gap-1.5 text-xs">
                            <div className="flex gap-2">
                                <span className="font-medium text-foreground min-w-[60px]">{t("income")}:</span>
                                <span className="text-muted-foreground">{eligibility}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-medium text-foreground min-w-[60px]">Benefit:</span>
                                <span className="text-muted-foreground">{benefit}</span>
                            </div>
                            {deadline && (
                                <div className="flex gap-2">
                                    <span className="font-medium text-foreground min-w-[60px]">Deadline:</span>
                                    <span className="text-accent font-medium">{deadline}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                        <ExternalLink size={14} className="mr-1" />
                        {t("apply")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-foreground bg-transparent">
                        <Bookmark size={14} />
                        <span className="sr-only">{t("save")}</span>
                    </Button>
                    <Button size="sm" variant="outline" className="text-foreground bg-transparent">
                        <Share2 size={14} />
                        <span className="sr-only">{t("share")}</span>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
