
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/auth-options"
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
        userId: session.user.id as string, // veya userId, modelinize uygun olan
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
      
      // Ödemeli mesajların sayısını hesapla
     // Ödemeli mesajların sayısını hesapla
      const paidMessages = messages.filter(message => message.payment > 0);
      // Toplam kazancı hesapla (her ödemeli mesaj için 10 TL)
      const totalEarnings = messages.reduce((sum, message) => sum + (Number(message.payment) || 0), 0);
      
      return {
        id: show.id,
        title: show.title,
        createdAt: show.createdAt,
        endedAt: show.endedAt,
        messageCount: messages.length,
        paidMessageCount: paidMessages.length,
        totalEarnings: totalEarnings
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