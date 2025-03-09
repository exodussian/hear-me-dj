import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { showId, displayName, content, paid, paymentId } = await request.json()
    
    // Show'un var olduğunu kontrol et
    const show = await prisma.show.findUnique({
      where: {
        id: showId,
        active: true
      }
    })
    
    if (!show) {
      return NextResponse.json({ error: "Show bulunamadı veya aktif değil" }, { status: 404 })
    }
    
    // Basit kelime filtresi
    const message = await prisma.message.create({
      data: {
        showId,
        displayName,
        content,
        paid: paid || false,
        paymentId
      }
    })
    
    return NextResponse.json(message)
  } catch (error: any) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Message oluşturulamadı", details: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const showId = searchParams.get('showId')
    
    if (!showId) {
      return NextResponse.json({ error: "showId parametresi gerekli" }, { status: 400 })
    }
    
    // Son 10 mesajı getir
    const messages = await prisma.message.findMany({
      where: {
        showId: showId,
        paid: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Mesajlar getirilemedi", details: error.message }, { status: 500 })
  }
}