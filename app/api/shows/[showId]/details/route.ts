import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../auth/[...nextauth]/route"
import prisma from "../../../../../src/lib/prisma"
import { NextResponse } from "next/server"


export async function GET(
  request: Request,
  { params }: { params: { showId: string } }
) {
  try {
    const showId = params.showId;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Show bilgilerini getir
    const show = await prisma.show.findUnique({
      where: { id: showId }
    });
    
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }
    
    // Bu show kullanıcıya ait mi kontrol et
    if (show.djId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Show'a ait mesajları getir
    const messages = await prisma.message.findMany({
      where: { showId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Toplam ödeme miktarını hesapla
    const payments = await prisma.message.aggregate({
      where: { showId },
      _sum: { payment: true }
    });
    
    // Show detaylarını formatla
    const showDetails = {
      id: show.id,
      title: show.title,
      createdAt: show.createdAt,
      endedAt: show.endedAt,
      messageCount: messages.length,
      totalEarnings: payments._sum.payment || 0,
      messages: messages
    };
    
    return NextResponse.json(showDetails);
  } catch (error) {
    console.error('Error fetching show details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch show details' },
      { status: 500 }
    );
  }
}