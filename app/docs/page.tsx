"use client"

import { useEffect, useState } from "react"
import "./swagger-ui.css"

export default function DocsPage() {
  const [swaggerUI, setSwaggerUI] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSwaggerUI = async () => {
      try {
        const SwaggerUI = (await import("swagger-ui-react")).default
        setSwaggerUI(() => SwaggerUI)
      } catch (error) {
        console.error("Failed to load Swagger UI:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSwaggerUI()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading API Documentation...</div>
        </div>
      </div>
    )
  }

  if (!swaggerUI) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Failed to load API Documentation</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const SwaggerUIComponent = swaggerUI

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Documentation</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive REST API documentation for a full-stack application featuring JWT authentication, todo
            management with advanced filtering, and real-time chat with WebSocket support. All endpoints include rate
            limiting, security middleware, and proper error handling.
          </p>
        </div>

        <div className="mb-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                🔐
              </div>
              <h3 className="font-semibold text-blue-900 ml-3">Authentication</h3>
            </div>
            <p className="text-blue-700 text-sm leading-relaxed">
              JWT-based authentication with refresh tokens, email verification, password recovery, and secure profile
              management.
            </p>
            <div className="mt-3 text-xs text-blue-600 font-medium">8 endpoints</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                📝
              </div>
              <h3 className="font-semibold text-green-900 ml-3">Todo Management</h3>
            </div>
            <p className="text-green-700 text-sm leading-relaxed">
              Complete CRUD operations with advanced filtering, sorting, bulk operations, and detailed analytics.
            </p>
            <div className="mt-3 text-xs text-green-600 font-medium">6 endpoints</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                💬
              </div>
              <h3 className="font-semibold text-purple-900 ml-3">Real-time Chat</h3>
            </div>
            <p className="text-purple-700 text-sm leading-relaxed">
              WebSocket-based messaging with chat rooms, file sharing, user presence, and real-time notifications.
            </p>
            <div className="mt-3 text-xs text-purple-600 font-medium">5 endpoints</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                🛡️
              </div>
              <h3 className="font-semibold text-red-900 ml-3">Security & System</h3>
            </div>
            <p className="text-red-700 text-sm leading-relaxed">
              Advanced rate limiting, IP blocking, input validation, and comprehensive security monitoring.
            </p>
            <div className="mt-3 text-xs text-red-600 font-medium">2 endpoints</div>
          </div>
        </div>

        <div className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100 p-8 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-6 text-xl">🚀 Getting Started</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">API Configuration</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center">
                  <span className="font-medium w-20">Base URL:</span>
                  <code className="bg-gray-200 px-3 py-1 rounded font-mono">/api</code>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-20">Format:</span>
                  <code className="bg-gray-200 px-3 py-1 rounded font-mono">JSON</code>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-20">Auth:</span>
                  <code className="bg-gray-200 px-3 py-1 rounded font-mono">Bearer Token</code>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Rate Limits & Features</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  • <strong>Auth endpoints:</strong> 5 requests/minute
                </div>
                <div>
                  • <strong>General endpoints:</strong> 100 requests/minute
                </div>
                <div>
                  • <strong>File uploads:</strong> Max 10MB (images, PDFs, docs)
                </div>
                <div>
                  • <strong>WebSocket:</strong> Real-time chat via Socket.io
                </div>
                <div>
                  • <strong>Security:</strong> IP blocking, input validation, audit logs
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <SwaggerUIComponent
            url="/api/docs"
            deepLinking={true}
            displayOperationId={false}
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            defaultModelRendering="example"
            displayRequestDuration={true}
            docExpansion="list"
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            supportedSubmitMethods={["get", "post", "put", "delete", "patch"]}
            validatorUrl={null}
            onComplete={() => {
              console.log("[v0] Swagger UI loaded successfully")
            }}
          />
        </div>
      </div>
    </div>
  )
}
