import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "../../../src/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { showId, displayName, content, payment = 0 } = await request.json()

    const message = await prisma.message.create({
      data: {
        showId,
        displayName,
        content,
        payment, // paymentId'yi kaldırın
        paid: false,
        // paymentId alanını şimdilik çıkarın
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json({ 
      error: 'Mesaj oluşturulurken bir hata oluştu',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 })
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