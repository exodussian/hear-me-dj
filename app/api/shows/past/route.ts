

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
          djId: session.user.id as string, // userId yerine djId kullan
          active: false,
          endedAt: { not: null }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Her show için mesaj sayısı ve ödeme bilgisini ekle
      const formattedShows = await Promise.all(shows.map(async (show) => {
        // Mesaj sayısını getir
        const messageCount = await prisma.message.count({
          where: { showId: show.id }
        });
        
        // Toplam ödeme miktarını mesajlardan hesapla
        const payments = await prisma.message.aggregate({
          where: { showId: show.id },
          _sum: { payment: true }
        });
        
        return {
          id: show.id,
          title: show.title,
          createdAt: show.createdAt,
          endedAt: show.endedAt,
          messageCount: messageCount,
          totalEarnings: payments._sum.payment || 0
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