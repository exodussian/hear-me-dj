import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { title } = await request.json();
    
    // Önce aktif showları kapat
    await prisma.show.updateMany({
      where: {
        userId: userId,  // djId yerine userId kullanın
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
        userId: userId,  // djId yerine userId kullanın
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