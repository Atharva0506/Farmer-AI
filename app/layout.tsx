import React from "react"
import type { Metadata, Viewport } from "next"
import { Noto_Sans_Devanagari } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { LanguageProvider } from "@/lib/language-context"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const notoSans = Noto_Sans_Devanagari({
  subsets: ["latin", "devanagari"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Kisan Mitra - AI Agriculture Assistant",
  description: "AI-powered agriculture assistant and marketplace for Indian farmers. Get crop help, disease detection, marketplace access, and government schemes information.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
