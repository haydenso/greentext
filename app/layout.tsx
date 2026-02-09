import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '4chan greentext generator',
  description: 'wikipedia bios for funsies',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
