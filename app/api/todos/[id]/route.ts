import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getTodoHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const todo = db.getTodoById(params.id)

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Check if todo belongs to the authenticated user
    if (todo.userId !== req.user!.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ todo })
  } catch (error) {
    console.error("[v0] Get todo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateTodoHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const { title, description, status, priority, dueDate } = await req.json()

    const todo = db.getTodoById(params.id)
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Check if todo belongs to the authenticated user
    if (todo.userId !== req.user!.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Validation
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
      }
      if (title.length > 200) {
        return NextResponse.json({ error: "Title must be less than 200 characters" }, { status: 400 })
      }
    }

    if (description !== undefined && description.length > 1000) {
      return NextResponse.json({ error: "Description must be less than 1000 characters" }, { status: 400 })
    }

    if (status && !["initial", "in-progress", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Priority must be low, medium, or high" }, { status: 400 })
    }

    // Prepare updates
    const updates: any = {}
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description?.trim()
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null

    const updatedTodo = db.updateTodo(params.id, updates)

    return NextResponse.json({
      message: "Todo updated successfully",
      todo: updatedTodo,
    })
  } catch (error) {
    console.error("[v0] Update todo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function deleteTodoHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const todo = db.getTodoById(params.id)
    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Check if todo belongs to the authenticated user
    if (todo.userId !== req.user!.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const deleted = db.deleteTodo(params.id)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Todo deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete todo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getTodoHandler)
export const PUT = withAuthAndRateLimit(generalLimiter)(updateTodoHandler)
export const DELETE = withAuthAndRateLimit(generalLimiter)(deleteTodoHandler)
