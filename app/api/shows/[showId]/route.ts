import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "../../../../src/lib/prisma"
import {NextRequest, NextResponse } from "next/server"



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { showId, displayName, content, paid = false, paymentId = null } = body;
    
    // Gereksiz alanları dahil etmeyin (örn. updatedAt)
    const message = await prisma.message.create({
      data: {
        showId,
        displayName,
        content,
        payment: 0, // veya ödeme tutarı 
        paid, // veritabanında bu alan varsa

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

export async function GET(
  request: NextRequest, 
  { params }: { params: { showId: string } }
) {
  try {
    const { showId } = params;

    const show = await prisma.show.findUnique({
      where: { id: showId },
    })

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { showId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Fetch messages error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}