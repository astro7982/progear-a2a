import type { Metadata } from 'next'
import { Fraunces, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
})
const dmSans = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
})
const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ProGear · Agent-to-Agent',
  description:
    'See how Okta keeps every AI agent action accountable to a real person. Live demo on bala-secures-ai.oktapreview.com.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  )
}
