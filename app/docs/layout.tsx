import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Comprehensive API documentation for authentication, todo management, and real-time chat",
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
