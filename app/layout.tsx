import type React from "react"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { LanguageProvider } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "GDG Auth",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl" translate="no">
        <head>
          <meta name="google" content="notranslate" />
          <link rel="icon" href="/favicon.ico" type="image/x-icon"/>
          <link rel="manifest" href="site.webmanifest" />
        </head>
        <body className="font-sans">
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
