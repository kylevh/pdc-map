import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Seattle GIS Layers',
  description: 'Interactive map with GeoJSON overlays and heatmaps',
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
