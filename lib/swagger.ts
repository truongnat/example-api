export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Full-Stack API",
    version: "1.0.0",
    description: "Comprehensive API with Authentication, Todo Management, and Real-time Chat",
    contact: {
      name: "API Support",
      email: "support@example.com",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          avatar: { type: "string", nullable: true },
          isVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Todo: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          title: { type: "string", maxLength: 200 },
          description: { type: "string", maxLength: 1000, nullable: true },
          status: { type: "string", enum: ["initial", "in-progress", "completed", "cancelled"] },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          dueDate: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ChatRoom: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", maxLength: 100 },
          description: { type: "string", maxLength: 500, nullable: true },
          createdBy: { type: "string" },
          members: { type: "array", items: { type: "string" } },
          onlineCount: { type: "number" },
          memberCount: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ChatMessage: {
        type: "object",
        properties: {
          id: { type: "string" },
          roomId: { type: "string" },
          userId: { type: "string" },
          content: { type: "string" },
          type: { type: "string", enum: ["text", "file", "image"] },
          fileUrl: { type: "string", nullable: true },
          fileName: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              avatar: { type: "string", nullable: true },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      Success: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description: "Create a new user account with email verification",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    userId: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          409: {
            description: "User already exists",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        description: "Authenticate user and return JWT tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Email not verified",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description: "Get new access token using refresh token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Token refreshed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          401: {
            description: "Invalid refresh token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "User logout",
        description: "Invalidate refresh token and logout user",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged out successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["Authentication"],
        summary: "Verify email address",
        description: "Verify user email with verification token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Email verified successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
          400: {
            description: "Invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset",
        description: "Send password reset token to user email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Reset link sent",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset password",
        description: "Reset user password with reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                  token: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
          400: {
            description: "Invalid or expired token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/auth/profile": {
      get: {
        tags: ["Authentication"],
        summary: "Get user profile",
        description: "Get current user profile information",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      put: {
        tags: ["Authentication"],
        summary: "Update user profile",
        description: "Update user profile information",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  avatar: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      patch: {
        tags: ["Authentication"],
        summary: "Change password",
        description: "Change user password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password changed successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
          400: {
            description: "Invalid current password",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/todos": {
      get: {
        tags: ["Todo Management"],
        summary: "Get todos",
        description: "Get user todos with filtering, sorting, and pagination",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["initial", "in-progress", "completed", "cancelled"] },
          },
          { name: "priority", in: "query", schema: { type: "string", enum: ["low", "medium", "high"] } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "sortBy", in: "query", schema: { type: "string", default: "createdAt" } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "Todos retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    todos: { type: "array", items: { $ref: "#/components/schemas/Todo" } },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                        hasNext: { type: "boolean" },
                        hasPrev: { type: "boolean" },
                      },
                    },
                    stats: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        initial: { type: "integer" },
                        inProgress: { type: "integer" },
                        completed: { type: "integer" },
                        cancelled: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      post: {
        tags: ["Todo Management"],
        summary: "Create todo",
        description: "Create a new todo item",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", maxLength: 200 },
                  description: { type: "string", maxLength: 1000 },
                  priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
                  dueDate: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Todo created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    todo: { $ref: "#/components/schemas/Todo" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/todos/{id}": {
      get: {
        tags: ["Todo Management"],
        summary: "Get todo by ID",
        description: "Get a specific todo by its ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Todo retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    todo: { $ref: "#/components/schemas/Todo" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Todo not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      put: {
        tags: ["Todo Management"],
        summary: "Update todo",
        description: "Update a specific todo",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", maxLength: 200 },
                  description: { type: "string", maxLength: 1000 },
                  status: { type: "string", enum: ["initial", "in-progress", "completed", "cancelled"] },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  dueDate: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Todo updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    todo: { $ref: "#/components/schemas/Todo" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Todo not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Todo Management"],
        summary: "Delete todo",
        description: "Delete a specific todo",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Todo deleted successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Todo not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/todos/bulk": {
      put: {
        tags: ["Todo Management"],
        summary: "Bulk update todos",
        description: "Update multiple todos at once",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["todoIds", "updates"],
                properties: {
                  todoIds: { type: "array", items: { type: "string" }, maxItems: 50 },
                  updates: {
                    type: "object",
                    properties: {
                      status: { type: "string", enum: ["initial", "in-progress", "completed", "cancelled"] },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Bulk update completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    updatedTodos: { type: "array", items: { $ref: "#/components/schemas/Todo" } },
                    errors: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Todo Management"],
        summary: "Bulk delete todos",
        description: "Delete multiple todos at once",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["todoIds"],
                properties: {
                  todoIds: { type: "array", items: { type: "string" }, maxItems: 50 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Bulk delete completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    deletedTodos: { type: "array", items: { type: "string" } },
                    errors: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/todos/stats": {
      get: {
        tags: ["Todo Management"],
        summary: "Get todo statistics",
        description: "Get detailed statistics about user todos",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "period", in: "query", schema: { type: "string", default: "30" }, description: "Period in days" },
        ],
        responses: {
          200: {
            description: "Statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    overview: {
                      type: "object",
                      properties: {
                        totalTodos: { type: "integer" },
                        completedTodos: { type: "integer" },
                        inProgressTodos: { type: "integer" },
                        overdueTodos: { type: "integer" },
                        completionRate: { type: "number" },
                      },
                    },
                    period: {
                      type: "object",
                      properties: {
                        days: { type: "integer" },
                        todosCreated: { type: "integer" },
                        todosCompleted: { type: "integer" },
                      },
                    },
                    breakdown: {
                      type: "object",
                      properties: {
                        priority: {
                          type: "object",
                          properties: {
                            high: { type: "integer" },
                            medium: { type: "integer" },
                            low: { type: "integer" },
                          },
                        },
                        status: {
                          type: "object",
                          properties: {
                            initial: { type: "integer" },
                            inProgress: { type: "integer" },
                            completed: { type: "integer" },
                            cancelled: { type: "integer" },
                          },
                        },
                      },
                    },
                    dailyActivity: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string", format: "date" },
                          created: { type: "integer" },
                          completed: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/chat/rooms": {
      get: {
        tags: ["Chat System"],
        summary: "Get chat rooms",
        description: "Get user's chat rooms with online counts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Rooms retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    rooms: { type: "array", items: { $ref: "#/components/schemas/ChatRoom" } },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      post: {
        tags: ["Chat System"],
        summary: "Create chat room",
        description: "Create a new chat room",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", maxLength: 100 },
                  description: { type: "string", maxLength: 500 },
                  members: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Room created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    room: { $ref: "#/components/schemas/ChatRoom" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/chat/rooms/{id}": {
      get: {
        tags: ["Chat System"],
        summary: "Get chat room details",
        description: "Get detailed information about a specific chat room",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Room details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    room: { $ref: "#/components/schemas/ChatRoom" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Room not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      put: {
        tags: ["Chat System"],
        summary: "Update chat room",
        description: "Update chat room details (creator only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", maxLength: 100 },
                  description: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Room updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    room: { $ref: "#/components/schemas/ChatRoom" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Room not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
      delete: {
        tags: ["Chat System"],
        summary: "Delete chat room",
        description: "Delete a chat room (creator only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: {
            description: "Room deleted successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Room not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/chat/rooms/{id}/messages": {
      get: {
        tags: ["Chat System"],
        summary: "Get chat messages",
        description: "Get messages from a chat room with pagination",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          200: {
            description: "Messages retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: { type: "array", items: { $ref: "#/components/schemas/ChatMessage" } },
                    pagination: {
                      type: "object",
                      properties: {
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                        hasMore: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          403: {
            description: "Access denied",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          404: {
            description: "Room not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/chat/upload": {
      post: {
        tags: ["Chat System"],
        summary: "Upload file for chat",
        description: "Upload a file to be shared in chat (max 10MB)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "roomId"],
                properties: {
                  file: { type: "string", format: "binary" },
                  roomId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    fileUrl: { type: "string" },
                    fileName: { type: "string" },
                    fileSize: { type: "integer" },
                    fileType: { type: "string" },
                  },
                },
              },
            },
          },
          400: {
            description: "File validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        description: "Check API health status",
        responses: {
          200: {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                    security: {
                      type: "object",
                      properties: {
                        blockedIPs: { type: "integer" },
                        recentEvents: { type: "integer" },
                      },
                    },
                    uptime: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/security/stats": {
      get: {
        tags: ["System"],
        summary: "Get security statistics",
        description: "Get detailed security statistics (authenticated users only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Security statistics retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: { type: "object" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
  },
  tags: [
    { name: "Authentication", description: "User authentication and profile management" },
    { name: "Todo Management", description: "CRUD operations for todo items" },
    { name: "Chat System", description: "Real-time chat rooms and messaging" },
    { name: "System", description: "System health and security monitoring" },
  ],
}
