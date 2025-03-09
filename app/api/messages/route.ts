import { NextRequest, NextResponse } from 'next/server'
import prisma from "@/lib/prisma"

type Params = {
  params: {
    showId: string
  }
}

export async function GET(
  request: NextRequest,
  context: Params
) {
  const { showId } = context.params;

  if (!showId) {
    return NextResponse.json({ error: 'Show ID is required' }, { status: 400 })
  }

  try {
    const show = await prisma.show.findUnique({
      where: { id: showId },
    })

    if (!show) {
      return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { showId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Fetch messages error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}