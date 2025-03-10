import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "../../../src/lib/prisma"
import { NextResponse } from "next/server"


// app/api/messages/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { showId, displayName, content, paid = false, paymentId = null } = body;
    
    // Veritabanında var olan alanları kullanarak mesaj oluştur
    const message = await prisma.message.create({
      data: {
        showId,
        displayName,
        content,
        payment: paid ? 10 : 0, // Ödeme varsa örnek değer
      }
    });
    
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
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