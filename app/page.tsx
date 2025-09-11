"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApiResponse {
  status: number
  data: any
  error?: string
}

export default function ApiTestingInterface() {
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [authToken, setAuthToken] = useState("")
  const [todoPriority, setTodoPriority] = useState("medium")
  const [todoStatusFilter, setTodoStatusFilter] = useState("all")
  const [bulkStatus, setBulkStatus] = useState("completed")

  const makeApiCall = async (endpoint: string, method: string, body?: any, useAuth = false) => {
    setLoading((prev) => ({ ...prev, [endpoint]: true }))

    try {
      const headers: Record<string, string> = {}

      // Only add Content-Type for requests with body
      if (body && method !== "GET") {
        headers["Content-Type"] = "application/json"
      }

      if (useAuth && authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: body && method !== "GET" ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      setResponses((prev) => ({
        ...prev,
        [endpoint]: {
          status: response.status,
          data,
        },
      }))
    } catch (error) {
      setResponses((prev) => ({
        ...prev,
        [endpoint]: {
          status: 0,
          data: null,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [endpoint]: false }))
    }
  }

  const ResponseDisplay = ({ endpoint }: { endpoint: string }) => {
    const response = responses[endpoint]
    if (!response) return null

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Response
            <Badge variant={response.status >= 200 && response.status < 300 ? "default" : "destructive"}>
              {response.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-32 w-full rounded border p-4">
            <pre className="text-sm">{response.error ? response.error : JSON.stringify(response.data, null, 2)}</pre>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">API Testing Interface</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive testing suite for authentication, todo management, chat, and security APIs
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Auth Token Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Authentication Token</CardTitle>
            <CardDescription>Current JWT token for authenticated requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Paste your JWT token here..."
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={() => setAuthToken("")}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="todos">Todo Management</TabsTrigger>
            <TabsTrigger value="chat">Chat System</TabsTrigger>
            <TabsTrigger value="security">Security & Health</TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="auth" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Register */}
              <Card>
                <CardHeader>
                  <CardTitle>Register User</CardTitle>
                  <CardDescription>POST /api/auth/register</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" defaultValue="password123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input id="reg-name" defaultValue="John Doe" />
                  </div>
                  <Button
                    onClick={() => {
                      const email = (document.getElementById("reg-email") as HTMLInputElement).value
                      const password = (document.getElementById("reg-password") as HTMLInputElement).value
                      const name = (document.getElementById("reg-name") as HTMLInputElement).value
                      makeApiCall("/api/auth/register", "POST", { email, password, name })
                    }}
                    disabled={loading["/api/auth/register"]}
                    className="w-full"
                  >
                    {loading["/api/auth/register"] ? "Registering..." : "Register"}
                  </Button>
                  <ResponseDisplay endpoint="/api/auth/register" />
                </CardContent>
              </Card>

              {/* Login */}
              <Card>
                <CardHeader>
                  <CardTitle>Login User</CardTitle>
                  <CardDescription>POST /api/auth/login</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" defaultValue="password123" />
                  </div>
                  <Button
                    onClick={() => {
                      const email = (document.getElementById("login-email") as HTMLInputElement).value
                      const password = (document.getElementById("login-password") as HTMLInputElement).value
                      makeApiCall("/api/auth/login", "POST", { email, password })
                    }}
                    disabled={loading["/api/auth/login"]}
                    className="w-full"
                  >
                    {loading["/api/auth/login"] ? "Logging in..." : "Login"}
                  </Button>
                  <ResponseDisplay endpoint="/api/auth/login" />
                </CardContent>
              </Card>

              {/* Verify Email */}
              <Card>
                <CardHeader>
                  <CardTitle>Verify Email</CardTitle>
                  <CardDescription>POST /api/auth/verify-email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify-token">Verification Token</Label>
                    <Input id="verify-token" defaultValue="paste-token-from-register-response" />
                  </div>
                  <Button
                    onClick={() => {
                      const token = (document.getElementById("verify-token") as HTMLInputElement).value
                      makeApiCall("/api/auth/verify-email", "POST", { token })
                    }}
                    disabled={loading["/api/auth/verify-email"]}
                    className="w-full"
                  >
                    {loading["/api/auth/verify-email"] ? "Verifying..." : "Verify Email"}
                  </Button>
                  <ResponseDisplay endpoint="/api/auth/verify-email" />
                </CardContent>
              </Card>

              {/* Get Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Get Profile</CardTitle>
                  <CardDescription>GET /api/auth/profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>Requires authentication token</AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => makeApiCall("/api/auth/profile", "GET", undefined, true)}
                    disabled={loading["/api/auth/profile"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/auth/profile"] ? "Loading..." : "Get Profile"}
                  </Button>
                  <ResponseDisplay endpoint="/api/auth/profile" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Todo Management Tab */}
          <TabsContent value="todos" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Create Todo */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Todo</CardTitle>
                  <CardDescription>POST /api/todos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="todo-title">Title</Label>
                    <Input id="todo-title" defaultValue="Complete project documentation" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="todo-description">Description</Label>
                    <Textarea
                      id="todo-description"
                      defaultValue="Write comprehensive documentation for the API endpoints and testing procedures"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={todoPriority} onValueChange={setTodoPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      const title = (document.getElementById("todo-title") as HTMLInputElement).value
                      const description = (document.getElementById("todo-description") as HTMLTextAreaElement).value
                      makeApiCall("/api/todos", "POST", { title, description, priority: todoPriority }, true)
                    }}
                    disabled={loading["/api/todos"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/todos"] ? "Creating..." : "Create Todo"}
                  </Button>
                  <ResponseDisplay endpoint="/api/todos" />
                </CardContent>
              </Card>

              {/* Get Todos */}
              <Card>
                <CardHeader>
                  <CardTitle>Get Todos</CardTitle>
                  <CardDescription>GET /api/todos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filter by Status</Label>
                    <Select value={todoStatusFilter} onValueChange={setTodoStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="initial">Initial</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      const queryParams = todoStatusFilter !== "all" ? `?status=${todoStatusFilter}` : ""
                      const endpoint = `/api/todos${queryParams}`
                      makeApiCall(endpoint, "GET", undefined, true)
                    }}
                    disabled={loading["/api/todos-get"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/todos-get"] ? "Loading..." : "Get Todos"}
                  </Button>
                  <ResponseDisplay endpoint="/api/todos-get" />
                </CardContent>
              </Card>

              {/* Todo Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Todo Statistics</CardTitle>
                  <CardDescription>GET /api/todos/stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => makeApiCall("/api/todos/stats", "GET", undefined, true)}
                    disabled={loading["/api/todos/stats"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/todos/stats"] ? "Loading..." : "Get Statistics"}
                  </Button>
                  <ResponseDisplay endpoint="/api/todos/stats" />
                </CardContent>
              </Card>

              {/* Bulk Operations */}
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Update Todos</CardTitle>
                  <CardDescription>PUT /api/todos/bulk</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulk-ids">Todo IDs (comma-separated)</Label>
                    <Input id="bulk-ids" defaultValue="1,2,3" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select value={bulkStatus} onValueChange={setBulkStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      const ids = (document.getElementById("bulk-ids") as HTMLInputElement).value
                        .split(",")
                        .map((id) => Number.parseInt(id.trim()))
                      makeApiCall("/api/todos/bulk", "PUT", { ids, status: bulkStatus }, true)
                    }}
                    disabled={loading["/api/todos/bulk"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/todos/bulk"] ? "Updating..." : "Bulk Update"}
                  </Button>
                  <ResponseDisplay endpoint="/api/todos/bulk" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat System Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Create Chat Room */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Chat Room</CardTitle>
                  <CardDescription>POST /api/chat/rooms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input id="room-name" defaultValue="General Discussion" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room-description">Description</Label>
                    <Textarea
                      id="room-description"
                      defaultValue="A place for general team discussions and announcements"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const name = (document.getElementById("room-name") as HTMLInputElement).value
                      const description = (document.getElementById("room-description") as HTMLTextAreaElement).value
                      makeApiCall("/api/chat/rooms", "POST", { name, description }, true)
                    }}
                    disabled={loading["/api/chat/rooms"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/chat/rooms"] ? "Creating..." : "Create Room"}
                  </Button>
                  <ResponseDisplay endpoint="/api/chat/rooms" />
                </CardContent>
              </Card>

              {/* Get Chat Rooms */}
              <Card>
                <CardHeader>
                  <CardTitle>Get Chat Rooms</CardTitle>
                  <CardDescription>GET /api/chat/rooms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => makeApiCall("/api/chat/rooms-get", "GET", undefined, true)}
                    disabled={loading["/api/chat/rooms-get"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/chat/rooms-get"] ? "Loading..." : "Get Rooms"}
                  </Button>
                  <ResponseDisplay endpoint="/api/chat/rooms-get" />
                </CardContent>
              </Card>

              {/* Send Message */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Message</CardTitle>
                  <CardDescription>POST /api/chat/rooms/[id]/messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="msg-room-id">Room ID</Label>
                    <Input id="msg-room-id" defaultValue="1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message-content">Message</Label>
                    <Textarea id="message-content" defaultValue="Hello everyone! 👋 How is everyone doing today?" />
                  </div>
                  <Button
                    onClick={() => {
                      const roomId = (document.getElementById("msg-room-id") as HTMLInputElement).value
                      const content = (document.getElementById("message-content") as HTMLTextAreaElement).value
                      const endpoint = `/api/chat/rooms/${roomId}/messages`
                      makeApiCall(endpoint, "POST", { content }, true)
                    }}
                    disabled={loading["/api/chat/send-message"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/chat/send-message"] ? "Sending..." : "Send Message"}
                  </Button>
                  <ResponseDisplay endpoint="/api/chat/send-message" />
                </CardContent>
              </Card>

              {/* Get Messages */}
              <Card>
                <CardHeader>
                  <CardTitle>Get Messages</CardTitle>
                  <CardDescription>GET /api/chat/rooms/[id]/messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="get-msg-room-id">Room ID</Label>
                    <Input id="get-msg-room-id" defaultValue="1" />
                  </div>
                  <Button
                    onClick={() => {
                      const roomId = (document.getElementById("get-msg-room-id") as HTMLInputElement).value
                      const endpoint = `/api/chat/rooms/${roomId}/messages`
                      makeApiCall(endpoint, "GET", undefined, true)
                    }}
                    disabled={loading["/api/chat/get-messages"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/chat/get-messages"] ? "Loading..." : "Get Messages"}
                  </Button>
                  <ResponseDisplay endpoint="/api/chat/get-messages" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security & Health Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Health Check */}
              <Card>
                <CardHeader>
                  <CardTitle>Health Check</CardTitle>
                  <CardDescription>GET /api/health</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => makeApiCall("/api/health", "GET")}
                    disabled={loading["/api/health"]}
                    className="w-full"
                  >
                    {loading["/api/health"] ? "Checking..." : "Check Health"}
                  </Button>
                  <ResponseDisplay endpoint="/api/health" />
                </CardContent>
              </Card>

              {/* Security Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Statistics</CardTitle>
                  <CardDescription>GET /api/security/stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => makeApiCall("/api/security/stats", "GET", undefined, true)}
                    disabled={loading["/api/security/stats"] || !authToken}
                    className="w-full"
                  >
                    {loading["/api/security/stats"] ? "Loading..." : "Get Security Stats"}
                  </Button>
                  <ResponseDisplay endpoint="/api/security/stats" />
                </CardContent>
              </Card>

              {/* Forgot Password */}
              <Card>
                <CardHeader>
                  <CardTitle>Forgot Password</CardTitle>
                  <CardDescription>POST /api/auth/forgot-password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input id="forgot-email" type="email" defaultValue="john.doe@example.com" />
                  </div>
                  <Button
                    onClick={() => {
                      const email = (document.getElementById("forgot-email") as HTMLInputElement).value
                      makeApiCall("/api/auth/forgot-password", "POST", { email })
                    }}
                    disabled={loading["/api/auth/forgot-password"]}
                    className="w-full"
                  >
                    {loading["/api/auth/forgot-password"] ? "Sending..." : "Send Reset Email"}
                  </Button>
                  <ResponseDisplay endpoint="/api/auth/forgot-password" />
                </CardContent>
              </Card>

              {/* Refresh Token */}
              <Card>
                <CardHeader>
                  <CardTitle>Refresh Token</CardTitle>
                  <CardDescription>POST /api/auth/refresh</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="refresh-token">Refresh Token</Label>
                    <Input id="refresh-token" defaultValue="paste-refresh-token-from-login-response" />
                  </div>
                  <Button
                    onClick={() => {
                      const refreshToken = (document.getElementById("refresh-token") as HTMLInputElement).value
                      makeApiCall("/api/auth/refresh", "POST", { refreshToken })
                    }}
                    disabled={loading["/api/auth/refresh"]}
                    className="w-full"
                  >
                    {loading["/api/auth/refresh"] ? "Refreshing..." : "Refresh Token"}
                  </Button>
                  <ResponseDisplay endpoint="/api/auth/refresh" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              API Testing Interface - Comprehensive testing suite for all endpoints
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="sm" asChild>
                <a href="/docs">API Documentation</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/api/docs">OpenAPI Spec</a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
