"use client"

import { HelpCircle, Phone, MessageSquare, Mail } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"

export default function HelpPage() {
    const { t } = useLanguage()

    const faqs = [
        { id: "item-1", q: "q1", a: "a1" },
        { id: "item-2", q: "q2", a: "a2" },
        { id: "item-3", q: "q3", a: "a3" },
    ]

    return (
        <div className="px-4 py-5 md:px-6 lg:px-8 max-w-3xl mx-auto pb-24">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-foreground mb-2">{t("helpTitle")}</h1>
                <p className="text-muted-foreground">{t("faqTitle")}</p>
            </div>

            <Card className="mb-8 border border-border">
                <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq) => (
                            <AccordionItem key={faq.id} value={faq.id}>
                                <AccordionTrigger className="text-left font-medium text-foreground">
                                    {t(faq.q)}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground">
                                    {t(faq.a)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Phone size={24} />
                        </div>
                        <h3 className="font-semibold">{t("contactSupport")}</h3>
                        <p className="text-sm text-muted-foreground">Available 9 AM - 6 PM</p>
                        <Button variant="outline" className="w-full mt-2 border-primary/50 text-primary hover:bg-primary/10">
                            {t("call")} 1800-123-4567
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-muted/50 border-border">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-foreground">
                            <Mail size={24} />
                        </div>
                        <h3 className="font-semibold">Email Us</h3>
                        <p className="text-sm text-muted-foreground">Get response within 24hrs</p>
                        <Button variant="outline" className="w-full mt-2">
                            support@kisanmitra.com
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
