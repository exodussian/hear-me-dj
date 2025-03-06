import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from '../../../src/lib/prisma';
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
    const body = await request.json();
    
    // Ayarları güncelle veya oluştur
    const settings = await prisma.dJSettings.upsert({
      where: { userId },
      update: {
        artistName: body.artistName,
        pricePerChar: body.pricePerChar,
        starPrice: body.starPrice,
        kissPrice: body.kissPrice,
        heartPrice: body.heartPrice,
        autoModerate: body.autoModerate,
        paypalEmail: body.paypalEmail
      },
      create: {
        userId,
        artistName: body.artistName,
        pricePerChar: body.pricePerChar,
        starPrice: body.starPrice,
        kissPrice: body.kissPrice,
        heartPrice: body.heartPrice,
        autoModerate: body.autoModerate,
        paypalEmail: body.paypalEmail
      }
    });
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    const settings = await prisma.dJSettings.findUnique({
      where: { userId }
    });
    
    return NextResponse.json({ settings: settings || {} });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}