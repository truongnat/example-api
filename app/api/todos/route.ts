import { NextResponse } from "next/server"
import { db, type Todo } from "@/lib/database"
import { AuthUtils } from "@/lib/auth"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getTodosHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Extract query parameters
    const status = searchParams.get("status") as Todo["status"] | null
    const priority = searchParams.get("priority") as Todo["priority"] | null
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    // Build filters
    const filters: any = {}
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (search) filters.search = search

    // Get todos with filters
    const todos = db.getTodosByUserId(req.user!.userId, filters)

    // Apply sorting
    todos.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Todo]
      let bValue: any = b[sortBy as keyof Todo]

      // Handle date sorting
      if (aValue instanceof Date) aValue = aValue.getTime()
      if (bValue instanceof Date) bValue = bValue.getTime()

      // Handle string sorting
      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTodos = todos.slice(startIndex, endIndex)

    // Calculate stats
    const stats = {
      total: todos.length,
      initial: todos.filter((t) => t.status === "initial").length,
      inProgress: todos.filter((t) => t.status === "in-progress").length,
      completed: todos.filter((t) => t.status === "completed").length,
      cancelled: todos.filter((t) => t.status === "cancelled").length,
    }

    return NextResponse.json({
      todos: paginatedTodos,
      pagination: {
        page,
        limit,
        total: todos.length,
        totalPages: Math.ceil(todos.length / limit),
        hasNext: endIndex < todos.length,
        hasPrev: page > 1,
      },
      stats,
    })
  } catch (error) {
    console.error("[v0] Get todos error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createTodoHandler(req: AuthenticatedRequest) {
  try {
    const { title, description, priority = "medium", dueDate } = await req.json()

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (title.length > 200) {
      return NextResponse.json({ error: "Title must be less than 200 characters" }, { status: 400 })
    }

    if (description && description.length > 1000) {
      return NextResponse.json({ error: "Description must be less than 1000 characters" }, { status: 400 })
    }

    if (!["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Priority must be low, medium, or high" }, { status: 400 })
    }

    // Create todo
    const todo: Todo = {
      id: AuthUtils.generateId(),
      userId: req.user!.userId,
      title: title.trim(),
      description: description?.trim(),
      status: "initial",
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const createdTodo = db.createTodo(todo)

    return NextResponse.json(
      {
        message: "Todo created successfully",
        todo: createdTodo,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create todo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getTodosHandler)
export const POST = withAuthAndRateLimit(generalLimiter)(createTodoHandler)
