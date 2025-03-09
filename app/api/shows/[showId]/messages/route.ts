// app/api/shows/[showId]/messages/route.ts

import { NextResponse } from 'next/server';
import prisma from "../../../../../src/lib/prisma"

 

export async function GET(
  request: Request,
  { params }: { params: { showId: string } }
) {
  try {
    const showId = params.showId;
    
    const show = await prisma.show.findUnique({
      where: { id: showId },
    });

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }
    
    // Mesajları getir (updatedAt kullanmadan)
    const messages = await prisma.message.findMany({
      where: {
        showId: showId,
      },
      orderBy: {
        createdAt: 'desc', // updatedAt yerine createdAt kullanın
      }
    });
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}