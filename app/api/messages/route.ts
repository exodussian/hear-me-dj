import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { showId, content, displayName, paid } = await request.json()
    
    // Show'un var olduğunu ve aktif olduğunu kontrol et
    const show = await prisma.show.findUnique({
      where: {
        id: showId,
        active: true
      }
    })
    
    if (!show) {
      return NextResponse.json({ error: "Show not found or not active" }, { status: 404 })
    }
    
    // Yasaklı kelimeler kontrolü (geliştirilecek)
    
    // Mesajı oluştur
    const message = await prisma.message.create({
      data: {
        showId,
        content,
        displayName,
        paid: paid || false,
        emojis: [] // Emoji desteği eklenebilir
      }
    })
    
    return NextResponse.json(message)
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}