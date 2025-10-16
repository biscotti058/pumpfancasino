import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🎰 PumpFun Casino | Play & Win on Solana 🎲',
  description: '🎰 Welcome to PumpFun Casino! Play slots, roulette, plinko, and coin flip games in a stunning 3D virtual casino. Win crypto on Solana blockchain! 🎲💎',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
