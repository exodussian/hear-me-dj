

import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "../../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Kullanıcının aktif olmayan (tamamlanan) showlarını getir
    const shows = await prisma.show.findMany({
      where: {
        userId: session.user.id as string,
        active: false,
        endedAt: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Her show için mesaj sayısı ve ödeme bilgisini ekle
    const formattedShows = await Promise.all(shows.map(async (show) => {
      // Her show için mesajları getir
      const messages = await prisma.message.findMany({
        where: { showId: show.id }
      });
      
      // Manuel olarak toplam ödemeyi hesapla
      const totalPayment = messages.reduce((sum, message) => {
        return sum + (message.payment || 0);
      }, 0);
      
      return {
        id: show.id,
        title: show.title,
        createdAt: show.createdAt,
        endedAt: show.endedAt,
        messageCount: messages.length,
        totalEarnings: totalPayment
      };
    }));
    
    return NextResponse.json(formattedShows);
  } catch (error) {
    console.error('Error fetching past shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past shows' },
      { status: 500 }
    );
  }
}