import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/auth-options"
import prisma from "../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized or user ID missing' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { title } = await request.json();
    
    // Önce aktif showları kapat
    await prisma.show.updateMany({
      where: {
        userId: userId,
        active: true,
      },
      data: {
        active: false,
        endedAt: new Date()
      }
    });
    
    // Yeni show oluştur
    const newShow = await prisma.show.create({
      data: {
        title,
        userId, // Artık kesinlikle string olacak
        active: true,
      }
    });
    
    return NextResponse.json(newShow);
  } catch (error) {
    console.error('Error creating show:', error);
    return NextResponse.json(
      { error: 'Failed to create show' },
      { status: 500 }
    );
  }
}