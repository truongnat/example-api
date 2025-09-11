import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { AuthUtils } from "@/lib/auth"
import { withAuthAndRateLimit, generalLimiter, type AuthenticatedRequest } from "@/lib/middleware"

async function uploadFileHandler(req: AuthenticatedRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const roomId = formData.get("roomId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", "chat")
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()
    const fileName = `${AuthUtils.generateId()}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/chat/${fileName}`

    return NextResponse.json({
      message: "File uploaded successfully",
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error) {
    console.error("[v0] File upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = withAuthAndRateLimit(generalLimiter)(uploadFileHandler)
