import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "../../../../src/lib/prisma"
import { NextResponse } from "next/server"



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { showId, displayName, content, paid = false, paymentId = "" } = body;
    
    // Veritabanında var olan alanları kullanarak mesaj oluştur
    const message = await prisma.message.create({
      data: {
        showId,
        displayName,
        content,
        paid,
        paymentId,
      },
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