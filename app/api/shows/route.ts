import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import prisma from "../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = session.user.id
    const { title } = await request.json()
    
    // Önce aktif showları kapat
    await prisma.show.updateMany({
      where: {
        djId: userId,
        active: true
      },
      data: {
        active: false,
        endedAt: new Date()
      }
    })
    
    // Yeni show oluştur
    const show = await prisma.show.create({
      data: {
        title: title || `Show - ${new Date().toLocaleString()}`,
        djId: userId
      }
    })
    
    return NextResponse.json(show)
  } catch (error) {
    console.error("Error creating show:", error)
    return NextResponse.json({ error: "Failed to create show" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = session.user.id
    
    const shows = await prisma.show.findMany({
      where: { djId: userId },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(shows)
  } catch (error) {
    console.error("Error fetching shows:", error)
    return NextResponse.json({ error: "Failed to fetch shows" }, { status: 500 })
  }
}