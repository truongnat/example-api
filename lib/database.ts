// In-memory database for users, todos, and chat messages
export interface User {
  id: string
  email: string
  password: string // hashed
  name: string
  avatar?: string
  isVerified: boolean
  verificationToken?: string
  resetToken?: string
  resetTokenExpiry?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Todo {
  id: string
  userId: string
  title: string
  description?: string
  status: "initial" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ChatRoom {
  id: string
  name: string
  description?: string
  createdBy: string
  members: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  type: "text" | "file" | "emoji"
  fileUrl?: string
  fileName?: string
  createdAt: Date
  editedAt?: Date
}

export interface RefreshToken {
  id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

// In-memory storage
class InMemoryDatabase {
  private users: Map<string, User> = new Map()
  private todos: Map<string, Todo> = new Map()
  private chatRooms: Map<string, ChatRoom> = new Map()
  private chatMessages: Map<string, ChatMessage> = new Map()
  private refreshTokens: Map<string, RefreshToken> = new Map()
  private usersByEmail: Map<string, string> = new Map() // email -> userId mapping

  // User operations
  createUser(user: User): User {
    this.users.set(user.id, user)
    this.usersByEmail.set(user.email, user.id)
    return user
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id)
  }

  getUserByEmail(email: string): User | undefined {
    const userId = this.usersByEmail.get(email)
    return userId ? this.users.get(userId) : undefined
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id)
    if (!user) return undefined

    const updatedUser = { ...user, ...updates, updatedAt: new Date() }
    this.users.set(id, updatedUser)
    return updatedUser
  }

  deleteUser(id: string): boolean {
    const user = this.users.get(id)
    if (!user) return false

    this.users.delete(id)
    this.usersByEmail.delete(user.email)
    return true
  }

  // Todo operations
  createTodo(todo: Todo): Todo {
    this.todos.set(todo.id, todo)
    return todo
  }

  getTodoById(id: string): Todo | undefined {
    return this.todos.get(id)
  }

  getTodosByUserId(
    userId: string,
    filters?: {
      status?: Todo["status"]
      priority?: Todo["priority"]
      search?: string
    },
  ): Todo[] {
    let todos = Array.from(this.todos.values()).filter((todo) => todo.userId === userId)

    if (filters?.status) {
      todos = todos.filter((todo) => todo.status === filters.status)
    }

    if (filters?.priority) {
      todos = todos.filter((todo) => todo.priority === filters.priority)
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      todos = todos.filter(
        (todo) => todo.title.toLowerCase().includes(search) || todo.description?.toLowerCase().includes(search),
      )
    }

    return todos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  updateTodo(id: string, updates: Partial<Todo>): Todo | undefined {
    const todo = this.todos.get(id)
    if (!todo) return undefined

    const updatedTodo = { ...todo, ...updates, updatedAt: new Date() }
    this.todos.set(id, updatedTodo)
    return updatedTodo
  }

  deleteTodo(id: string): boolean {
    return this.todos.delete(id)
  }

  // Chat room operations
  createChatRoom(room: ChatRoom): ChatRoom {
    this.chatRooms.set(room.id, room)
    return room
  }

  getChatRoomById(id: string): ChatRoom | undefined {
    return this.chatRooms.get(id)
  }

  getChatRoomsByUserId(userId: string): ChatRoom[] {
    return Array.from(this.chatRooms.values())
      .filter((room) => room.members.includes(userId))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  updateChatRoom(id: string, updates: Partial<ChatRoom>): ChatRoom | undefined {
    const room = this.chatRooms.get(id)
    if (!room) return undefined

    const updatedRoom = { ...room, ...updates, updatedAt: new Date() }
    this.chatRooms.set(id, updatedRoom)
    return updatedRoom
  }

  deleteChatRoom(id: string): boolean {
    // Also delete all messages in this room
    const messages = Array.from(this.chatMessages.values()).filter((msg) => msg.roomId === id)
    messages.forEach((msg) => this.chatMessages.delete(msg.id))

    return this.chatRooms.delete(id)
  }

  // Chat message operations
  createChatMessage(message: ChatMessage): ChatMessage {
    this.chatMessages.set(message.id, message)
    return message
  }

  getChatMessageById(id: string): ChatMessage | undefined {
    return this.chatMessages.get(id)
  }

  getChatMessagesByRoomId(roomId: string, limit = 50, offset = 0): ChatMessage[] {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.roomId === roomId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit)
  }

  updateChatMessage(id: string, updates: Partial<ChatMessage>): ChatMessage | undefined {
    const message = this.chatMessages.get(id)
    if (!message) return undefined

    const updatedMessage = { ...message, ...updates, editedAt: new Date() }
    this.chatMessages.set(id, updatedMessage)
    return updatedMessage
  }

  deleteChatMessage(id: string): boolean {
    return this.chatMessages.delete(id)
  }

  // Refresh token operations
  createRefreshToken(token: RefreshToken): RefreshToken {
    this.refreshTokens.set(token.id, token)
    return token
  }

  getRefreshToken(token: string): RefreshToken | undefined {
    return Array.from(this.refreshTokens.values()).find((rt) => rt.token === token)
  }

  deleteRefreshToken(token: string): boolean {
    const refreshToken = this.getRefreshToken(token)
    if (!refreshToken) return false

    return this.refreshTokens.delete(refreshToken.id)
  }

  deleteRefreshTokensByUserId(userId: string): void {
    const tokens = Array.from(this.refreshTokens.values()).filter((rt) => rt.userId === userId)
    tokens.forEach((token) => this.refreshTokens.delete(token.id))
  }

  // Cleanup expired tokens
  cleanupExpiredTokens(): void {
    const now = new Date()
    const expiredTokens = Array.from(this.refreshTokens.values()).filter((token) => token.expiresAt < now)
    expiredTokens.forEach((token) => this.refreshTokens.delete(token.id))
  }
}

// Singleton instance
export const db = new InMemoryDatabase()

// Cleanup expired tokens every hour
setInterval(
  () => {
    db.cleanupExpiredTokens()
  },
  60 * 60 * 1000,
)
