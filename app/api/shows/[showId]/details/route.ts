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
    
    // Show'u tüm mesajlarıyla birlikte getir
    const show = await prisma.show.findUnique({
      where: { 
        id: showId,
        userId: session.user.id as string 
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 });
    }
    
    // Show detaylarını formatla
    const showDetails = {
      id: show.id,
      title: show.title,
      createdAt: show.createdAt,
      endedAt: show.endedAt,
      messageCount: show.messages.length,
      totalEarnings: show.totalEarnings || 0,
      messages: show.messages
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