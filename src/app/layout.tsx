import type { Metadata } from 'next'
import { Outfit, Work_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  variable: '--font-display',
  subsets: ['latin'],
})
const workSans = Work_Sans({
  variable: '--font-body',
  subsets: ['latin'],
})
const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ProGear · Sales Console',
  description: 'ProGear internal sales operations console with AI-powered assistance.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${workSans.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="h-full font-sans">{children}</body>
    </html>
  )
}
