import { getServerSession } from "next-auth/next";
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import prisma from '../../../../src/lib/prisma';
import { NextResponse } from "next/server";

// Tür tanımlamaları burada ekleniyor
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Session {
  user: SessionUser;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const userId = session.user.id;
    const { words } = await request.json();
    
    // Önce mevcut yasaklı kelimeleri temizle
    await prisma.bannedWord.deleteMany({
      where: { userId }
    });
    
    // Yeni kelimeleri ekle
    if (words && words.length > 0) {
      const bannedWords = await Promise.all(
        words.map((word: string) => 
          prisma.bannedWord.create({
            data: {
              userId,
              word: word.trim()
            }
          })
        )
      );
      
      return NextResponse.json({ success: true, bannedWords });
    }
    
    return NextResponse.json({ success: true, bannedWords: [] });
  } catch (error) {
    console.error("Error updating banned words:", error);
    return NextResponse.json({ error: "Failed to update banned words" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    const bannedWords = await prisma.bannedWord.findMany({
      where: { userId }
    });
    
    return NextResponse.json({ words: bannedWords.map((bw: { word: string }) => bw.word) });
  } catch (error) {
    console.error("Error fetching banned words:", error);
    return NextResponse.json({ error: "Failed to fetch banned words" }, { status: 500 });
  }
}