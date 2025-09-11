import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function bulkUpdateHandler(req: AuthenticatedRequest) {
  try {
    const { todoIds, updates } = await req.json()

    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json({ error: "Todo IDs array is required" }, { status: 400 })
    }

    if (todoIds.length > 50) {
      return NextResponse.json({ error: "Cannot update more than 50 todos at once" }, { status: 400 })
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Updates object is required" }, { status: 400 })
    }

    // Validate updates
    const { status, priority } = updates
    if (status && !["initial", "in-progress", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 })
    }

    const updatedTodos = []
    const errors = []

    for (const todoId of todoIds) {
      const todo = db.getTodoById(todoId)

      if (!todo) {
        errors.push({ todoId, error: "Todo not found" })
        continue
      }

      if (todo.userId !== req.user!.userId) {
        errors.push({ todoId, error: "Access denied" })
        continue
      }

      const updatedTodo = db.updateTodo(todoId, updates)
      if (updatedTodo) {
        updatedTodos.push(updatedTodo)
      } else {
        errors.push({ todoId, error: "Update failed" })
      }
    }

    return NextResponse.json({
      message: `Bulk update completed. ${updatedTodos.length} todos updated.`,
      updatedTodos,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Bulk update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function bulkDeleteHandler(req: AuthenticatedRequest) {
  try {
    const { todoIds } = await req.json()

    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json({ error: "Todo IDs array is required" }, { status: 400 })
    }

    if (todoIds.length > 50) {
      return NextResponse.json({ error: "Cannot delete more than 50 todos at once" }, { status: 400 })
    }

    const deletedTodos = []
    const errors = []

    for (const todoId of todoIds) {
      const todo = db.getTodoById(todoId)

      if (!todo) {
        errors.push({ todoId, error: "Todo not found" })
        continue
      }

      if (todo.userId !== req.user!.userId) {
        errors.push({ todoId, error: "Access denied" })
        continue
      }

      const deleted = db.deleteTodo(todoId)
      if (deleted) {
        deletedTodos.push(todoId)
      } else {
        errors.push({ todoId, error: "Delete failed" })
      }
    }

    return NextResponse.json({
      message: `Bulk delete completed. ${deletedTodos.length} todos deleted.`,
      deletedTodos,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[v0] Bulk delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PUT = withAuthAndRateLimit(generalLimiter)(bulkUpdateHandler)
export const DELETE = withAuthAndRateLimit(generalLimiter)(bulkDeleteHandler)
