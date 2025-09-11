import { NextResponse } from "next/server"
import { db } from "@/lib/database"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function getStatsHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get("period") || "30" // days

    const todos = db.getTodosByUserId(req.user!.userId)
    const now = new Date()
    const periodStart = new Date(now.getTime() - Number.parseInt(period) * 24 * 60 * 60 * 1000)

    // Overall stats
    const totalTodos = todos.length
    const completedTodos = todos.filter((t) => t.status === "completed").length
    const inProgressTodos = todos.filter((t) => t.status === "in-progress").length
    const overdueTodos = todos.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== "completed" && t.status !== "cancelled",
    ).length

    // Period stats
    const todosInPeriod = todos.filter((t) => t.createdAt >= periodStart)
    const completedInPeriod = todos.filter((t) => t.status === "completed" && t.updatedAt >= periodStart).length

    // Priority breakdown
    const priorityStats = {
      high: todos.filter((t) => t.priority === "high").length,
      medium: todos.filter((t) => t.priority === "medium").length,
      low: todos.filter((t) => t.priority === "low").length,
    }

    // Status breakdown
    const statusStats = {
      initial: todos.filter((t) => t.status === "initial").length,
      inProgress: todos.filter((t) => t.status === "in-progress").length,
      completed: todos.filter((t) => t.status === "completed").length,
      cancelled: todos.filter((t) => t.status === "cancelled").length,
    }

    // Completion rate
    const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0

    // Daily activity for the period (simplified)
    const dailyActivity = []
    for (let i = Number.parseInt(period) - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const created = todos.filter((t) => t.createdAt >= dayStart && t.createdAt < dayEnd).length
      const completed = todos.filter(
        (t) => t.status === "completed" && t.updatedAt >= dayStart && t.updatedAt < dayEnd,
      ).length

      dailyActivity.push({
        date: dayStart.toISOString().split("T")[0],
        created,
        completed,
      })
    }

    return NextResponse.json({
      overview: {
        totalTodos,
        completedTodos,
        inProgressTodos,
        overdueTodos,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      period: {
        days: Number.parseInt(period),
        todosCreated: todosInPeriod.length,
        todosCompleted: completedInPeriod,
      },
      breakdown: {
        priority: priorityStats,
        status: statusStats,
      },
      dailyActivity,
    })
  } catch (error) {
    console.error("[v0] Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuthAndRateLimit(generalLimiter)(getStatsHandler)
