

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
    
    // User ID'sini al
    const userId = session.user.id;
    
    // Kullanıcının aktif olmayan (tamamlanan) showlarını getir
    const shows = await prisma.show.findMany({
      where: {
        userId: userId as string,
        active: false,
        endedAt: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });
    
    // Her show için mesaj sayısı ve kazanç bilgisini ekle
    const formattedShows = await Promise.all(shows.map(async (show) => {
      return {
        id: show.id,
        title: show.title,
        createdAt: show.createdAt,
        endedAt: show.endedAt,
        messageCount: show._count.messages,
        totalEarnings: show.totalEarnings || 0
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