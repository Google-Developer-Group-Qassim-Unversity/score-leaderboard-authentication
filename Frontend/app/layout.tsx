import type React from "react"
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Suspense } from "react"
import Script from 'next/script';
export const metadata: Metadata = {
  title: "GDG",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.png" type="image/png"/>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className="font-sans">
          {/* TODO: Add a better loading indicator */}
          <Suspense fallback={<div>Loading...</div>}>
            <Navigation />
            {children}
          </Suspense>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
