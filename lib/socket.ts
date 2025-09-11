import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { AuthUtils } from "./auth"
import { db } from "./database"
import { chatLimiter } from "./rate-limiter"

export interface SocketUser {
  userId: string
  email: string
  name: string
  avatar?: string
}

export interface ConnectedSocket {
  id: string
  user: SocketUser
  rooms: Set<string>
  lastActivity: Date
}

class SocketManager {
  private io: SocketIOServer | null = null
  private connectedUsers: Map<string, ConnectedSocket> = new Map()
  private userSockets: Map<string, Set<string>> = new Map() // userId -> socketIds

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:3000"],
        methods: ["GET", "POST"],
      },
    })

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error("Authentication required"))
        }

        const payload = AuthUtils.verifyAccessToken(token)
        if (!payload) {
          return next(new Error("Invalid token"))
        }

        const user = db.getUserById(payload.userId)
        if (!user) {
          return next(new Error("User not found"))
        }

        socket.data.user = {
          userId: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        }

        next()
      } catch (error) {
        next(new Error("Authentication failed"))
      }
    })

    this.io.on("connection", (socket) => {
      this.handleConnection(socket)
    })

    console.log("[v0] Socket.io server initialized")
  }

  private handleConnection(socket: any) {
    const user = socket.data.user as SocketUser
    console.log(`[v0] User ${user.name} connected with socket ${socket.id}`)

    // Track connected user
    const connectedSocket: ConnectedSocket = {
      id: socket.id,
      user,
      rooms: new Set(),
      lastActivity: new Date(),
    }

    this.connectedUsers.set(socket.id, connectedSocket)

    // Track user sockets
    if (!this.userSockets.has(user.userId)) {
      this.userSockets.set(user.userId, new Set())
    }
    this.userSockets.get(user.userId)!.add(socket.id)

    // Join user to their rooms
    const userRooms = db.getChatRoomsByUserId(user.userId)
    userRooms.forEach((room) => {
      socket.join(room.id)
      connectedSocket.rooms.add(room.id)

      // Notify room members that user is online
      socket.to(room.id).emit("user_online", {
        userId: user.userId,
        name: user.name,
        avatar: user.avatar,
      })
    })

    // Socket event handlers
    socket.on("join_room", (data: { roomId: string }) => {
      this.handleJoinRoom(socket, data)
    })

    socket.on("leave_room", (data: { roomId: string }) => {
      this.handleLeaveRoom(socket, data)
    })

    socket.on("send_message", (data: any) => {
      this.handleSendMessage(socket, data)
    })

    socket.on("typing_start", (data: { roomId: string }) => {
      this.handleTypingStart(socket, data)
    })

    socket.on("typing_stop", (data: { roomId: string }) => {
      this.handleTypingStop(socket, data)
    })

    socket.on("get_online_users", (data: { roomId: string }) => {
      this.handleGetOnlineUsers(socket, data)
    })

    socket.on("disconnect", () => {
      this.handleDisconnection(socket)
    })
  }

  private handleJoinRoom(socket: any, data: { roomId: string }) {
    const user = socket.data.user as SocketUser
    const room = db.getChatRoomById(data.roomId)

    if (!room || !room.members.includes(user.userId)) {
      socket.emit("error", { message: "Access denied to room" })
      return
    }

    socket.join(data.roomId)
    const connectedSocket = this.connectedUsers.get(socket.id)
    if (connectedSocket) {
      connectedSocket.rooms.add(data.roomId)
    }

    // Notify room members
    socket.to(data.roomId).emit("user_joined_room", {
      userId: user.userId,
      name: user.name,
      avatar: user.avatar,
      roomId: data.roomId,
    })

    socket.emit("joined_room", { roomId: data.roomId })
  }

  private handleLeaveRoom(socket: any, data: { roomId: string }) {
    const user = socket.data.user as SocketUser

    socket.leave(data.roomId)
    const connectedSocket = this.connectedUsers.get(socket.id)
    if (connectedSocket) {
      connectedSocket.rooms.delete(data.roomId)
    }

    // Notify room members
    socket.to(data.roomId).emit("user_left_room", {
      userId: user.userId,
      name: user.name,
      roomId: data.roomId,
    })

    socket.emit("left_room", { roomId: data.roomId })
  }

  private handleSendMessage(socket: any, data: any) {
    const user = socket.data.user as SocketUser
    const { roomId, content, type = "text", fileUrl, fileName } = data

    // Rate limiting
    const identifier = `${user.userId}:${roomId}`
    if (!chatLimiter.isAllowed(identifier)) {
      socket.emit("error", { message: "Too many messages. Please slow down." })
      return
    }

    // Validate room access
    const room = db.getChatRoomById(roomId)
    if (!room || !room.members.includes(user.userId)) {
      socket.emit("error", { message: "Access denied to room" })
      return
    }

    // Create message
    const message = {
      id: AuthUtils.generateId(),
      roomId,
      userId: user.userId,
      content,
      type,
      fileUrl,
      fileName,
      createdAt: new Date(),
    }

    const savedMessage = db.createChatMessage(message)

    // Broadcast message to room
    const messageWithUser = {
      ...savedMessage,
      user: {
        id: user.userId,
        name: user.name,
        avatar: user.avatar,
      },
    }

    this.io!.to(roomId).emit("new_message", messageWithUser)

    // Update room's last activity
    db.updateChatRoom(roomId, { updatedAt: new Date() })
  }

  private handleTypingStart(socket: any, data: { roomId: string }) {
    const user = socket.data.user as SocketUser

    socket.to(data.roomId).emit("user_typing", {
      userId: user.userId,
      name: user.name,
      roomId: data.roomId,
    })
  }

  private handleTypingStop(socket: any, data: { roomId: string }) {
    const user = socket.data.user as SocketUser

    socket.to(data.roomId).emit("user_stopped_typing", {
      userId: user.userId,
      roomId: data.roomId,
    })
  }

  private handleGetOnlineUsers(socket: any, data: { roomId: string }) {
    const room = db.getChatRoomById(data.roomId)
    if (!room) return

    const onlineUsers = []
    for (const [socketId, connectedSocket] of this.connectedUsers.entries()) {
      if (connectedSocket.rooms.has(data.roomId)) {
        onlineUsers.push({
          userId: connectedSocket.user.userId,
          name: connectedSocket.user.name,
          avatar: connectedSocket.user.avatar,
          lastActivity: connectedSocket.lastActivity,
        })
      }
    }

    socket.emit("online_users", { roomId: data.roomId, users: onlineUsers })
  }

  private handleDisconnection(socket: any) {
    const user = socket.data.user as SocketUser
    const connectedSocket = this.connectedUsers.get(socket.id)

    if (connectedSocket) {
      // Notify all rooms that user is offline
      connectedSocket.rooms.forEach((roomId) => {
        socket.to(roomId).emit("user_offline", {
          userId: user.userId,
          name: user.name,
        })
      })

      // Remove from tracking
      this.connectedUsers.delete(socket.id)
      const userSocketSet = this.userSockets.get(user.userId)
      if (userSocketSet) {
        userSocketSet.delete(socket.id)
        if (userSocketSet.size === 0) {
          this.userSockets.delete(user.userId)
        }
      }
    }

    console.log(`[v0] User ${user.name} disconnected`)
  }

  // Public methods for API usage
  notifyRoom(roomId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(roomId).emit(event, data)
    }
  }

  notifyUser(userId: string, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userId)
    if (userSocketIds && this.io) {
      userSocketIds.forEach((socketId) => {
        this.io!.to(socketId).emit(event, data)
      })
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId)
  }

  getOnlineUsersInRoom(roomId: string): SocketUser[] {
    const onlineUsers: SocketUser[] = []
    for (const connectedSocket of this.connectedUsers.values()) {
      if (connectedSocket.rooms.has(roomId)) {
        onlineUsers.push(connectedSocket.user)
      }
    }
    return onlineUsers
  }
}

export const socketManager = new SocketManager()
