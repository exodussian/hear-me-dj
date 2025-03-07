import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import prisma from "../../../../src/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: { showId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userId = session.user.id
    const { showId } = params
    const { active, endedAt } = await request.json()
    
    // Show'un sahibi olduğunu kontrol et
    const show = await prisma.show.findUnique({
      where: { id: showId }
    })
    
    if (!show || show.djId !== userId) {
      return NextResponse.json({ error: "Not authorized to update this show" }, { status: 403 })
    }
    
    // Show'u güncelle
    const updatedShow = await prisma.show.update({
      where: { id: showId },
      data: { active, endedAt }
    })
    
    return NextResponse.json(updatedShow)
  } catch (error) {
    console.error("Error updating show:", error)
    return NextResponse.json({ error: "Failed to update show" }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { showId: string } }
) {
  try {
    const { showId } = params
    
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' }
        },
        dj: {
          select: {
            name: true,
            settings: true
          }
        }
      }
    })
    
    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 })
    }
    
    return NextResponse.json(show)
  } catch (error) {
    console.error("Error fetching show:", error)
    return NextResponse.json({ error: "Failed to fetch show" }, { status: 500 })
  }
}